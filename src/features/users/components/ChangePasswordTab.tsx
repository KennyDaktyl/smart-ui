import { useState } from "react";
import {
  Alert,
  Snackbar,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useTranslation } from "react-i18next";

import { authApi } from "@/api/authApi";
import FormCard from "@/components/forms/FormCard";
import FormTextField from "@/components/forms/FormTextField";
import FormSubmitButton from "@/components/forms/FormSubmitButton";

export default function ChangePasswordTab() {
  const { t } = useTranslation();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [toastOpen, setToastOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordType = showPassword ? "text" : "password";

  const passwordAdornment = {
    endAdornment: (
      <InputAdornment position="end">
        <IconButton
          onClick={() => setShowPassword((v) => !v)}
          edge="end"
          aria-label={t("account.password.toggle")}
        >
          {showPassword ? <VisibilityOff /> : <Visibility />}
        </IconButton>
      </InputAdornment>
    ),
  };

  const handleSubmit = async () => {
    setError(null);
    setSuccess(false);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError(t("account.password.errors.missing"));
      setToastOpen(true);
      return;
    }

    if (newPassword.length < 8) {
      setError(t("account.password.errors.tooShort"));
      setToastOpen(true);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError(t("account.password.errors.notMatching"));
      setToastOpen(true);
      return;
    }

    try {
      setLoading(true);
      await authApi.changePassword({
        current_password: currentPassword,
        new_password: newPassword,
      });

      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      setError(
        err?.response?.data?.detail ||
          t("account.password.errors.generic")
      );
      setToastOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <FormCard
        successMessage={
          success ? t("account.password.success") : undefined
        }
      >
        <FormTextField
          label={t("account.password.current")}
          type={passwordType}
          autoComplete="current-password"
          slotProps={{ input: passwordAdornment }}
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />

        <FormTextField
          label={t("account.password.new")}
          type={passwordType}
          autoComplete="new-password"
          slotProps={{ input: passwordAdornment }}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />

        <FormTextField
          label={t("account.password.confirm")}
          type={passwordType}
          autoComplete="new-password"
          slotProps={{ input: passwordAdornment }}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        <FormSubmitButton loading={loading} onClick={handleSubmit}>
          {loading
            ? t("common.waitingForStatus")
            : t("account.password.submit")}
        </FormSubmitButton>
      </FormCard>

      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={() => setToastOpen(false)}
      >
        <Alert severity="error" variant="filled">
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}
