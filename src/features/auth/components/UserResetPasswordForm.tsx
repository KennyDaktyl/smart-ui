import { useState } from "react";
import {
  Alert,
  AlertColor,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { authApi } from "@/api/authApi";
import { parseApiError } from "@/api/parseApiError";
import Toast from "@/components/Toast";

export default function UserResetPasswordForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const token = params.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{
    open: boolean;
    severity: AlertColor;
    message: string;
  }>({
    open: false,
    severity: "success",
    message: "",
  });

  const handleSubmit = async () => {
    setError(null);
    setSuccess(null);

    if (!token) {
      setError(t("auth.reset.invalidToken"));
      setToastOpen(true);
      return;
    }

    if (!password || password.length < 8) {
      setError(t("auth.reset.passwordTooShort"));
      setToastOpen(true);
      return;
    }

    if (password !== confirmPassword) {
      setError(t("auth.reset.passwordsDoNotMatch"));
      setToastOpen(true);
      return;
    }

    try {
      setLoading(true);
      await authApi.confirmPasswordReset({
        token,
        new_password: password,
      });

      const successMessage = t("auth.reset.success");
      setSuccess(successMessage);
      setToast({ open: true, severity: "success", message: successMessage });

      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      const message = parseApiError(err).message || t("auth.reset.error");

      setError(message);
      setToast({ open: true, severity: "error", message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack spacing={1.5}>
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <TextField
          label={t("auth.fields.newPassword")}
          type={showPassword ? "text" : "password"}
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((v) => !v)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />

        <TextField
          label={t("auth.fields.confirmPassword")}
          type={showPassword ? "text" : "password"}
          fullWidth
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
        />

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          sx={{ borderRadius: 10, py: 1.1 }}
        >
          {loading
            ? t("common.waitingForStatus")
            : t("auth.reset.submit")}
        </Button>
      </Stack>

      {/* Toast */}
      <Toast
        open={toast.open}
        severity={toast.severity}
        message={toast.message}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </>
  );
}
