import { Visibility, VisibilityOff } from "@mui/icons-material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import {
  Alert,
  Box,
  Button,
  IconButton,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useContext, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate } from "react-router-dom";

import { useToast } from "@/context/ToastContext";
import { parseApiError } from "@/api/parseApiError";
import { authApi } from "../../api/authApi";
import { AuthContext } from "../../context/AuthContext";

export default function LoginPage() {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const { t } = useTranslation();
  const { notifySuccess, notifyError } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    try {
      const res = await authApi.login({ email, password });
      const { access_token, refresh_token } = res.data;

      auth?.login(access_token, refresh_token);

      notifySuccess(t("auth.login.success"));

      navigate("/dashboard", { replace: true });
    } catch (err) {
      const message = parseApiError(err).message || t("auth.login.errorDefault");

      setError(message);
      notifyError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={3} sx={{ width: "100%", maxWidth: 520, mx: "auto" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            {t("auth.login.title")}
          </Typography>
          <Typography variant="body2" color="rgba(232,241,248,0.8)">
            {t("auth.login.subtitle")}
          </Typography>
        </Box>

        <Button
          component={Link}
          to="/"
          startIcon={<ArrowBackIcon />}
          variant="text"
          color="secondary"
          sx={{ borderRadius: 10, textTransform: "none" }}
        >
          {t("common.back")}
        </Button>
      </Stack>

      <Box
        sx={{
          p: 3,
          borderRadius: 3,
          background:
            "linear-gradient(145deg, rgba(255,255,255,0.96) 0%, #f3fbf7 100%)",
          boxShadow: "0 18px 40px rgba(0,0,0,0.24)",
          color: "#0d1b2a",
        }}
      >
        <Stack spacing={1.5}>
          {error && <Alert severity="error">{error}</Alert>}

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
            autoComplete="current-password"
            InputProps={{
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
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleLogin();
            }}
          />

          <Button
            variant="contained"
            onClick={handleLogin}
            disabled={loading}
            sx={{ borderRadius: 10, py: 1.1 }}
          >
            {loading
              ? t("common.waitingForStatus")
              : t("auth.login.submit")}
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
}
