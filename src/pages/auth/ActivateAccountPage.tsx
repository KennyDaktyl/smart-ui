import { Alert, Box, Button, Stack, TextField, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { authApi } from "@/api/authApi";
import { parseApiError } from "@/api/parseApiError";

type ActivateLocationState = {
  email?: string;
};

export default function ActivateAccountPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  const locationState = (location.state as ActivateLocationState | null) ?? null;
  const email = locationState?.email;

  const [token, setToken] = useState(params.get("token") ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleActivate = async () => {
    const normalizedToken = token.trim();

    if (!normalizedToken) {
      setError(t("auth.activate.tokenRequired"));
      setSuccess(null);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await authApi.confirmEmail(normalizedToken);
      setSuccess(t("auth.activate.success"));
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed.message || t("auth.activate.error"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack spacing={3} sx={{ width: "100%", maxWidth: 520, mx: "auto" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            {t("auth.activate.title")}
          </Typography>
          <Typography variant="body2" color="rgba(232,241,248,0.8)">
            {t("auth.activate.subtitle")}
          </Typography>
        </Box>

        <Button
          component={Link}
          to="/register"
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
          background: "linear-gradient(145deg, rgba(255,255,255,0.96) 0%, #f3fbf7 100%)",
          boxShadow: "0 18px 40px rgba(0,0,0,0.24)",
          color: "#0d1b2a",
        }}
      >
        <Stack spacing={1.5}>
          {email && <Alert severity="info">{t("auth.activate.emailSent", { email })}</Alert>}
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}

          <TextField
            label={t("auth.activate.tokenLabel")}
            fullWidth
            value={token}
            onChange={(event) => {
              setToken(event.target.value);
              if (error) setError(null);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                void handleActivate();
              }
            }}
          />

          <Button
            variant="contained"
            onClick={handleActivate}
            disabled={loading}
            sx={{ borderRadius: 10, py: 1.1 }}
          >
            {loading ? t("common.loading") : t("auth.activate.submit")}
          </Button>

          <Button
            variant="outlined"
            onClick={() => navigate("/login")}
            sx={{ borderRadius: 10 }}
          >
            {t("auth.activate.goToLogin")}
          </Button>
        </Stack>
      </Box>
    </Stack>
  );
}
