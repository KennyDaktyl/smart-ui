import { useState, useContext } from "react";
import { Box, Button, TextField, Typography, Alert, Stack } from "@mui/material";
import { useNavigate } from "react-router-dom";
import { authApi } from "../../api/authApi";
import { AuthContext } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import AuthPageLayout from "@/front/AuthPageLayout";

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
      const { access_token, refresh_token } = res.data;
      auth?.login(access_token, refresh_token);
      navigate("/");
    } catch (err: any) {
      setError(err.response?.data?.detail || t("auth.login.errorDefault"));
    }
  };

  return (
    <AuthPageLayout title={t("auth.login.title")} subtitle="Zaloguj się, aby wejść do panelu Smart Energy.">
      <Stack spacing={1.5}>
        {error && <Alert severity="error">{error}</Alert>}
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
        <Button variant="contained" onClick={handleLogin} sx={{ borderRadius: 10, py: 1.1 }}>
          {t("auth.login.submit")}
        </Button>
        <Button
          variant="outlined"
          onClick={() => navigate("/register")}
          sx={{ borderRadius: 10 }}
        >
          {t("auth.login.goRegister")}
        </Button>
        <Button
          variant="text"
          size="small"
          onClick={() => navigate("/forgot-password")}
          sx={{ alignSelf: "flex-start" }}
        >
          Przypomnij hasło
        </Button>
      </Stack>
    </AuthPageLayout>
  );
}
