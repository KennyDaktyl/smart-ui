import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { microcontrollerApi } from "@/api/microcontrollerApi";

export default function MicrocontrollerDetailsPage() {
  const { microcontrollerUuid } = useParams<{ microcontrollerUuid: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const parseError = (error: unknown) => {
    if (!axios.isAxiosError(error)) {
      return t("common.errors.generic");
    }
    const status = error.response?.status;
    if (status === 401) return t("common.errors.sessionExpired");
    if (status === 500) return t("common.errors.serverError");
    if (status === 422) return t("common.errors.invalidInput");
    const detail = error.response?.data?.detail;
    if (typeof detail === "string") return detail;
    return t("common.errors.requestFailed");
  };

  const [microcontroller, setMicrocontroller] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    if (!token || !microcontrollerUuid) return;
    setLoading(true);
    setError(null);
    try {
      const res = await microcontrollerApi.getMicrocontrollerByUuid(token, microcontrollerUuid);
      setMicrocontroller(res.data ?? null);
    } catch (err) {
      setError(parseError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token, microcontrollerUuid]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="70vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!microcontroller) {
    return (
      <Box p={{ xs: 1.5, md: 3 }}>
        <Alert severity="error">{error ?? t("microcontrollers.notFound")}</Alert>
      </Box>
    );
  }

  const providerItems = [
    ...(microcontroller.power_provider ? [microcontroller.power_provider] : []),
    ...(Array.isArray(microcontroller.sensor_providers) ? microcontroller.sensor_providers : []),
  ];

  return (
    <Box
      p={{ xs: 1.5, md: 3 }}
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(15,139,111,0.12), transparent 45%), radial-gradient(circle at bottom right, rgba(17,61,78,0.12), transparent 40%)",
      }}
    >
      <Stack spacing={0.5} mb={3}>
        <Typography
          variant="h4"
          sx={{
            color: "#f1f7f6",
            textShadow: "0 2px 10px rgba(8,24,36,0.35)",
            letterSpacing: "0.3px",
          }}
        >
          {microcontroller.name ?? t("microcontrollers.singleTitle")}
        </Typography>
        <Typography sx={{ color: "rgba(241,247,246,0.8)" }}>
          {t("microcontrollers.uuidLabel", {
            uuid: microcontroller.uuid ?? microcontrollerUuid,
          })}
        </Typography>
      </Stack>

      {error && <Alert severity="error">{error}</Alert>}

      <Card
        sx={{
          borderRadius: 2.5,
          border: "1px solid rgba(8,24,36,0.08)",
          backgroundColor: "rgba(255,255,255,0.96)",
          boxShadow: "0 12px 30px rgba(8,24,36,0.08)",
        }}
      >
        <CardContent>
          <Stack spacing={2}>
            {microcontroller.status && (
              <Typography variant="body2" sx={{ color: "rgba(11,31,42,0.75)" }}>
                {t("microcontrollers.statusLabel", { status: microcontroller.status })}
              </Typography>
            )}
            <Stack spacing={0.5}>
              {microcontroller.type && (
                <Typography variant="body2" sx={{ color: "rgba(11,31,42,0.75)" }}>
                  {t("microcontrollers.typeLabel", { type: microcontroller.type })}
                </Typography>
              )}
              {microcontroller.software_version && (
                <Typography variant="body2" sx={{ color: "rgba(11,31,42,0.75)" }}>
                  {t("microcontrollers.softwareVersionLabel", {
                    version: microcontroller.software_version,
                  })}
                </Typography>
              )}
              {typeof microcontroller.max_devices === "number" && (
                <Typography variant="body2" sx={{ color: "rgba(11,31,42,0.75)" }}>
                  {t("microcontrollers.maxDevicesLabel", {
                    count: microcontroller.max_devices,
                  })}
                </Typography>
              )}
              {typeof microcontroller.enabled === "boolean" && (
                <Typography variant="body2" sx={{ color: "rgba(11,31,42,0.75)" }}>
                  {t("microcontrollers.enabledLabel", {
                    status: microcontroller.enabled ? t("common.yes") : t("common.no"),
                  })}
                </Typography>
              )}
            </Stack>
            {microcontroller.description && (
              <Typography variant="body2" sx={{ color: "rgba(11,31,42,0.75)" }}>
                {microcontroller.description}
              </Typography>
            )}
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button variant="outlined" onClick={() => navigate("/microcontrollers")}>
                {t("microcontrollers.backToList")}
              </Button>
              <Button
                variant="contained"
                onClick={() =>
                  navigate(`/microcontrollers/${microcontroller.uuid ?? microcontrollerUuid}/controller`)
                }
              >
                {t("microcontrollers.openProviders")}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Stack spacing={2} mt={3}>
        <Typography variant="h6" sx={{ color: "#f1f7f6" }}>
          {t("microcontrollers.providersTitle")}
        </Typography>
        <Divider sx={{ borderColor: "rgba(241,247,246,0.2)" }} />
        {providerItems.length > 0 ? (
          <Stack spacing={2}>
            {providerItems.map((provider: any) => (
              <Card
                key={provider.uuid ?? provider.id}
                sx={{
                  borderRadius: 2.5,
                  border: "1px solid rgba(8,24,36,0.08)",
                  backgroundColor: "rgba(255,255,255,0.96)",
                  boxShadow: "0 12px 30px rgba(8,24,36,0.08)",
                }}
              >
                <CardContent>
                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                      <Typography variant="subtitle1">
                        {provider.name ?? t("providers.unknownProvider")}
                      </Typography>
                      {provider.provider_type && (
                        <Chip size="small" label={provider.provider_type.toUpperCase()} />
                      )}
                      {provider.vendor && <Chip size="small" variant="outlined" label={provider.vendor} />}
                      {provider.enabled === false && (
                        <Chip size="small" color="warning" label={t("providers.status.disabled")} />
                      )}
                    </Stack>
                    <Typography variant="body2" sx={{ color: "rgba(11,31,42,0.75)" }}>
                      {t("providers.card.kindUnit", {
                        kind: provider.kind ?? "-",
                        unit: provider.unit ?? "-",
                      })}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "rgba(11,31,42,0.75)" }}>
                      {t("providers.card.range", {
                        min: provider.value_min ?? "-",
                        max: provider.value_max ?? "-",
                      })}
                    </Typography>
                    <Typography variant="body2" sx={{ color: "rgba(11,31,42,0.75)" }}>
                      {t("providers.card.lastValue", {
                        value: provider.last_value ?? "-",
                      })}
                    </Typography>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Stack>
        ) : (
          <Typography variant="body2" sx={{ color: "rgba(241,247,246,0.75)" }}>
            {t("microcontrollers.noProviders")}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}
