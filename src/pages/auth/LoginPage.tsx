import { useState, useContext } from "react";
import { Box, Button, TextField, Typography, Paper, Alert } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../api/authApi";
import { AuthContext } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";

export default function LoginPage() {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = async () => {
    try {
      const res = await authApi.login({ email, password });
      const token = res.data.access_token;
      auth?.login(token);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.detail || t("auth.login.errorDefault"));
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
      <Paper elevation={3} sx={{ p: 4, width: 400 }}>
        <Typography variant="h5" mb={2}>{t("auth.login.title")}</Typography>
        {error && <Alert severity="error">{error}</Alert>}
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
        <Button fullWidth variant="contained" sx={{ mt: 2 }} onClick={handleLogin}>
          {t("auth.login.submit")}
        </Button>
        <Button fullWidth sx={{ mt: 1 }} onClick={() => navigate("/register")}>
          {t("auth.login.goRegister")}
        </Button>
      </Paper>
    </Box>
  );
}
