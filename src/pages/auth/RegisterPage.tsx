import { useState } from "react";
import { Box, Button, TextField, Typography, Alert, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../api/authApi";
import { useTranslation } from "react-i18next";
import AuthPageLayout from "@/front/AuthPageLayout";

export default function RegisterPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleRegister = async () => {
    try {
      await authApi.register({ email, password });
      setSuccess(t("auth.register.success"));
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) {
      setError(err.response?.data?.detail || t("auth.register.error"));
    }
  };

  return (
    <AuthPageLayout title={t("auth.register.title")} subtitle="Utwórz konto i zarządzaj instalacjami w czasie rzeczywistym.">
      <Stack spacing={1.5}>
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}
        <TextField
          label={t("auth.fields.email")}
          fullWidth
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label={t("auth.fields.password")}
          type="password"
          fullWidth
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button variant="contained" onClick={handleRegister} sx={{ borderRadius: 10, py: 1.1 }}>
          {t("auth.register.submit")}
        </Button>
        <Button
          variant="outlined"
          onClick={() => navigate("/login")}
          sx={{ borderRadius: 10 }}
        >
          {t("auth.register.haveAccount")}
        </Button>
      </Stack>
    </AuthPageLayout>
  );
}
