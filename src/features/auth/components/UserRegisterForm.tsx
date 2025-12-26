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
import Toast from "@/components/Toast";

export default function UserRegisterForm() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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

  const handleRegister = async () => {
    if (!email || !password) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await authApi.register({ email, password });
      const successMessage = t("auth.register.success");
      setSuccess(successMessage);
      setToast({ open: true, severity: "success", message: successMessage });

      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) {
      const message =
        err?.response?.data?.detail ||
        t("auth.register.error");

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
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
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
