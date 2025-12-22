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
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MemoryIcon from "@mui/icons-material/Memory";
import { useTranslation } from "react-i18next";

import { adminApi } from "@/api/adminApi";
import { useAuth } from "@/features/auth/hooks/useAuth";

export default function AdminMicrocontrollerDetailsPage() {
  const { microcontrollerUuid } = useParams<{ microcontrollerUuid: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { t } = useTranslation();

  const [microcontroller, setMicrocontroller] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDetails = async () => {
    if (!token || !microcontrollerUuid) return;
    setLoading(true);
    setError("");
    try {
      const res = await adminApi.getMicrocontrollerByUuid(token, microcontrollerUuid);
      setMicrocontroller(res.data ?? null);
    } catch (err) {
      console.error("Failed to load microcontroller", err);
      setError(t("admin.errors.loadMicrocontrollers"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDetails();
  }, [microcontrollerUuid, token]);

  const handleDelete = async () => {
    if (!token || !microcontrollerUuid) return;
    if (!confirm(t("admin.microcontrollers.deleteConfirm", { name: microcontroller?.name ?? "" }))) {
      return;
    }
    await adminApi.deleteMicrocontrollerByUuid(token, microcontrollerUuid);
    navigate("/admin/microcontrollers");
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" height="70vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !microcontroller) {
    return (
      <Box p={{ xs: 2, md: 3 }}>
        <Alert severity="error">{error || t("admin.errors.loadMicrocontrollers")}</Alert>
      </Box>
    );
  }

  const providerLabel = microcontroller?.active_provider
    ? microcontroller.active_provider.name ??
      microcontroller.active_provider.vendor ??
      t("admin.microcontrollers.unknownProvider")
    : t("admin.microcontrollers.noProvider");

  const sensorsLabel =
    Array.isArray(microcontroller.assigned_sensors) &&
    microcontroller.assigned_sensors.length > 0
      ? microcontroller.assigned_sensors.join(", ")
      : t("admin.microcontrollers.noSensors");

  return (
    <Box
      p={{ xs: 2, md: 4 }}
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(15,139,111,0.18), transparent 48%), radial-gradient(circle at bottom right, rgba(17,61,78,0.2), transparent 45%), linear-gradient(180deg, #081824 0%, #0b1f2a 40%, #081824 100%)",
      }}
    >
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/admin/microcontrollers")}
        variant="outlined"
        sx={{
          mb: 2.5,
          borderColor: "rgba(255,255,255,0.35)",
          color: "#e8f1f8",
        }}
      >
        {t("admin.microcontrollers.backToList")}
      </Button>

      <Card
        sx={{
          borderRadius: 3,
          border: "1px solid rgba(13,27,42,0.12)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(245,249,248,0.94) 100%)",
          boxShadow: "0 18px 42px rgba(8,24,36,0.2)",
        }}
      >
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <MemoryIcon sx={{ color: "#0f8b6f" }} />
              <Typography variant="h6" sx={{ color: "#0b1f2a" }}>
                {microcontroller.name ?? microcontroller.uuid}
              </Typography>
              <Chip
                size="small"
                label={
                  microcontroller.enabled
                    ? t("admin.microcontrollers.statusActive")
                    : t("admin.microcontrollers.statusInactive")
                }
                color={microcontroller.enabled ? "success" : "default"}
              />
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  onClick={() => navigate(`/admin/microcontrollers/${microcontroller.uuid}/edit`)}
                >
                  {t("admin.microcontrollers.editButton")}
                </Button>
                <Button variant="text" color="error" onClick={handleDelete}>
                  {t("admin.microcontrollers.deleteButton")}
                </Button>
              </Stack>
            </Stack>

            <Typography variant="body2" sx={{ color: "rgba(11,31,42,0.62)" }}>
              UUID: {microcontroller.uuid}
            </Typography>
            <Typography variant="body2" sx={{ color: "rgba(11,31,42,0.62)" }}>
              {t("admin.microcontrollers.ownerLabel")}: {microcontroller.user_email}
            </Typography>
            {microcontroller.type && (
              <Typography variant="body2" sx={{ color: "rgba(11,31,42,0.62)" }}>
                {t("admin.microcontrollers.typeLabel", { type: microcontroller.type })}
              </Typography>
            )}
            {microcontroller.software_version && (
              <Typography variant="body2" sx={{ color: "rgba(11,31,42,0.62)" }}>
                {t("admin.microcontrollers.softwareLabel", {
                  version: microcontroller.software_version,
                })}
              </Typography>
            )}

            <Divider sx={{ borderColor: "rgba(11,31,42,0.12)" }} />

            <Stack spacing={0.5}>
              <Typography variant="subtitle2" sx={{ color: "#0b1f2a" }}>
                {t("admin.microcontrollers.fields.sensors")}
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(11,31,42,0.62)" }}>
                {sensorsLabel}
              </Typography>
            </Stack>

            <Stack spacing={0.5}>
              <Typography variant="subtitle2" sx={{ color: "#0b1f2a" }}>
                {t("admin.microcontrollers.activeProvider")}
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(11,31,42,0.62)" }}>
                {providerLabel}
              </Typography>
            </Stack>

            <Stack spacing={0.5}>
              <Typography variant="subtitle2" sx={{ color: "#0b1f2a" }}>
                {t("admin.microcontrollers.devicesTitle")}
              </Typography>
              {Array.isArray(microcontroller.devices) &&
              microcontroller.devices.length > 0 ? (
                <Stack spacing={0.75}>
                  {microcontroller.devices.map((device: any) => (
                    <Stack
                      key={device.uuid ?? device.id}
                      direction="row"
                      spacing={1}
                      alignItems="center"
                    >
                      <Typography variant="body2" sx={{ color: "#0b1f2a" }}>
                        {device.name ?? t("admin.microcontrollers.deviceFallback")}
                      </Typography>
                      <Chip size="small" label={device.mode ?? "-"} />
                    </Stack>
                  ))}
                </Stack>
              ) : (
                <Typography variant="body2" sx={{ color: "rgba(11,31,42,0.62)" }}>
                  {t("admin.microcontrollers.devicesEmpty")}
                </Typography>
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
}
