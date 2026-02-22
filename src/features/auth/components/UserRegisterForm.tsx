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
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { authApi } from "@/api/authApi";
import { parseApiError } from "@/api/parseApiError";
import Toast from "@/components/Toast";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function UserRegisterForm() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [emailError, setEmailError] = useState<string | null>(null);
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

  const handleRegister = async () => {
    const normalizedEmail = email.trim();
    const missingEmailMessage = t("errors.validation.emailRequired");
    const invalidEmailMessage = t("errors.validation.emailInvalid");

    if (!normalizedEmail) {
      setEmailError(missingEmailMessage);
      setError(missingEmailMessage);
      return;
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setEmailError(invalidEmailMessage);
      setError(invalidEmailMessage);
      return;
    }

    if (!password) {
      return;
    }

    setLoading(true);
    setEmailError(null);
    setError(null);
    setSuccess(null);

    try {
      await authApi.register({ email: normalizedEmail, password });
      const successMessage = t("auth.register.success");
      setSuccess(successMessage);
      setToast({ open: true, severity: "success", message: successMessage });

      setTimeout(
        () =>
          navigate("/activate-account", {
            state: { email: normalizedEmail },
          }),
        800
      );
    } catch (err) {
      const parsed = parseApiError(err);
      const emailFieldError = parsed.fieldErrors?.email;
      const message = emailFieldError || parsed.message || t("auth.register.error");

      setEmailError(emailFieldError ?? null);
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
          label={t("auth.fields.email")}
          type="email"
          fullWidth
          value={email}
          error={Boolean(emailError)}
          helperText={emailError ?? " "}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError(null);
            if (error) setError(null);
          }}
          autoComplete="email"
        />

        <TextField
          label={t("auth.fields.password")}
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
                    aria-label="toggle password visibility"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleRegister();
          }}
        />

        <Button
          variant="contained"
          onClick={handleRegister}
          disabled={loading}
          sx={{ borderRadius: 10, py: 1.1 }}
        >
          {loading
            ? t("common.waitingForStatus")
            : t("auth.register.submit")}
        </Button>

        <Button
          variant="outlined"
          onClick={() => navigate("/login")}
          sx={{ borderRadius: 10 }}
        >
          {t("auth.register.haveAccount")}
        </Button>
      </Stack>

      <Toast
        open={toast.open}
        severity={toast.severity}
        message={toast.message}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
      />
    </>
  );
}
