import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { authApi } from "@/api/authApi";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useTranslation } from "react-i18next";

type Mode = "login" | "register";

export function AuthPanel() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [mode, setMode] = useState<Mode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    setSuccess("");
    if (!email || !password) {
      setError(t("landing.authPanel.errors.missingFields"));
      return;
    }
    try {
      setLoading(true);
      if (mode === "login") {
        const res = await authApi.login({ email, password });
        const { access_token, refresh_token } = res.data;
        login(access_token, refresh_token);
        navigate("/");
      } else {
        await authApi.register({ email, password });
        setSuccess(t("landing.authPanel.registerSuccess"));
        setMode("login");
      }
    } catch (err: any) {
      setError(err?.response?.data?.detail || t("landing.authPanel.errors.generic"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        p: 2.5,
        borderRadius: 3,
        background: "linear-gradient(145deg, rgba(255,255,255,0.96) 0%, #f3fbf7 100%)",
        boxShadow: "0 18px 40px rgba(0,0,0,0.24)",
        minWidth: { xs: "100%", sm: 360 },
      }}
    >
      <Tabs
        value={mode}
        onChange={(_, val) => setMode(val)}
        aria-label={t("landing.authPanel.ariaTabs")}
        textColor="primary"
        indicatorColor="primary"
      >
        <Tab value="login" label={t("landing.authPanel.tabs.login")} />
        <Tab value="register" label={t("landing.authPanel.tabs.register")} />
      </Tabs>

      <Stack spacing={1.25} mt={2}>
        <TextField
          label={t("auth.fields.email")}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
        />
        <TextField
          label={t("auth.fields.password")}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
        />

        {mode === "register" && (
          <Typography variant="caption" color="text.secondary">
            {t("landing.authPanel.registerHint")}
          </Typography>
        )}

        {error && <Alert severity="error">{error}</Alert>}
        {success && <Alert severity="success">{success}</Alert>}

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={loading}
          sx={{
            mt: 1,
            borderRadius: 10,
            py: 1.1,
            boxShadow: "0 12px 26px rgba(15,139,111,0.3)",
          }}
        >
          {loading
            ? t("landing.authPanel.processing")
            : mode === "login"
            ? t("landing.authPanel.submitLogin")
            : t("landing.authPanel.submitRegister")}
        </Button>

        <Button
          variant="text"
          size="small"
          onClick={() => setMode(mode === "login" ? "register" : "login")}
        >
          {mode === "login"
            ? t("landing.authPanel.switchToRegister")
            : t("landing.authPanel.switchToLogin")}
        </Button>
      </Stack>
    </Box>
  );
}

export default AuthPanel;
