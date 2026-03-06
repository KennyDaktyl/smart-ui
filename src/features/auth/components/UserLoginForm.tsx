import { useState, useContext } from "react";
import {
  Alert,
  Snackbar,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { authApi } from "@/api/authApi";
import { parseApiError } from "@/api/parseApiError";
import { AuthContext } from "@/context/AuthContext";

import FormCard from "@/components/forms/FormCard";
import FormTextField from "@/components/forms/FormTextField";
import FormSubmitButton from "@/components/forms/FormSubmitButton";
import FormActions from "@/components/forms/FormActions";

export default function UserLoginForm() {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);
  const { t } = useTranslation();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [toastOpen, setToastOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordType = showPassword ? "text" : "password";

  const passwordAdornment = {
    endAdornment: (
      <InputAdornment position="end">
        <IconButton
          onClick={() => setShowPassword((v) => !v)}
          edge="end"
          aria-label={t("auth.login.togglePassword")}
        >
          {showPassword ? <VisibilityOff /> : <Visibility />}
        </IconButton>
      </InputAdornment>
    ),
  };

  const handleLogin = async () => {
    if (!email || !password) return;

    setLoading(true);
    setError(null);

    try {
      const res = await authApi.login({ email, password });
      const { access_token, refresh_token } = res.data;

      auth?.login(access_token, refresh_token);
      navigate("/");
    } catch (err) {
      setError(parseApiError(err).message || t("auth.login.errorDefault"));
      setToastOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <FormCard>
        <FormTextField
          label={t("auth.fields.email")}
          value={email}
          autoComplete="email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <FormTextField
          label={t("auth.fields.password")}
          type={passwordType}
          value={password}
          autoComplete="current-password"
          slotProps={{ input: passwordAdornment }}
          onChange={(e) => setPassword(e.target.value)}
        />

        <FormSubmitButton
          loading={loading}
          onClick={handleLogin}
        >
          {loading
            ? t("common.waitingForStatus")
            : t("auth.login.submit")}
        </FormSubmitButton>

        {/* secondary actions */}
        <FormSubmitButton
          variant="outlined"
          onClick={() => navigate("/register")}
        >
          {t("auth.login.goRegister")}
        </FormSubmitButton>

        <FormActions align="start">
          <FormSubmitButton
            variant="text"
            size="small"
            onClick={() => navigate("/forgot-password")}
          >
            {t("auth.login.forgotPassword")}
          </FormSubmitButton>
        </FormActions>
      </FormCard>

      {/* 🔔 TOAST ERROR */}
      <Snackbar
        open={toastOpen}
        autoHideDuration={4000}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity="error"
          onClose={() => setToastOpen(false)}
          variant="filled"
        >
          {error}
        </Alert>
      </Snackbar>
    </>
  );
}
