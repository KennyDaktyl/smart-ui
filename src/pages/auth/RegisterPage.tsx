import { useState } from "react";
import { Box, Button, TextField, Typography, Paper, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../api/authApi";
import { useTranslation } from "react-i18next";

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
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
      <Paper elevation={3} sx={{ p: 4, width: 400 }}>
        <Typography variant="h5" mb={2}>{t("auth.register.title")}</Typography>
        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}
        <TextField
          label={t("auth.fields.email")}
          fullWidth
          margin="normal"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <TextField
          label={t("auth.fields.password")}
          type="password"
          fullWidth
          margin="normal"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={handleRegister}>
          {t("auth.register.submit")}
        </Button>
        <Button fullWidth sx={{ mt: 1 }} onClick={() => navigate("/login")}>
          {t("auth.register.haveAccount")}
        </Button>
      </Paper>
    </Box>
  );
}
