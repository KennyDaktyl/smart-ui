import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MemoryIcon from "@mui/icons-material/Memory";
import { useTranslation } from "react-i18next";

import { adminApi } from "@/api/adminApi";
import { useAuth } from "@/features/auth/hooks/useAuth";

export default function AdminMicrocontrollerDetailsPage() {
  const { userId, microcontrollerUuid } = useParams<{
    userId: string;
    microcontrollerUuid: string;
  }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { t } = useTranslation();

  const [microcontroller, setMicrocontroller] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    software_version: "",
    max_devices: 4,
    type: "raspberry_pi_zero",
    assigned_sensors: [] as string[],
  });

  const providerLabel = useMemo(() => {
    const provider = microcontroller?.active_provider;
    if (!provider) return t("admin.microcontrollers.noProvider");
    return provider.name ?? provider.vendor ?? t("admin.microcontrollers.unknownProvider");
  }, [microcontroller, t]);

  useEffect(() => {
    if (!token || !userId || !microcontrollerUuid) return;

    const load = async () => {
      setLoading(true);
      try {
        const res = await adminApi.getMicrocontroller(
          token,
          Number(userId),
          microcontrollerUuid
        );
        setMicrocontroller(res.data ?? null);
        setError("");
      } catch (err) {
        console.error("Failed to load microcontroller", err);
        setError(t("admin.errors.loadMicrocontrollers"));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, userId, microcontrollerUuid, t]);

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
        onClick={() => navigate(`/admin/users/${userId}`)}
        variant="outlined"
        sx={{
          mb: 2.5,
          borderColor: "rgba(255,255,255,0.35)",
          color: "#e8f1f8",
        }}
      >
        {t("admin.microcontrollers.backToUser")}
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
                {microcontroller.name ?? t("admin.microcontrollers.unknown")}
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
            </Stack>

            <Typography variant="body2" sx={{ color: "rgba(11,31,42,0.62)" }}>
              UUID: {microcontroller.uuid}
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
              {Array.isArray(microcontroller.devices) && microcontroller.devices.length > 0 ? (
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

            <Divider sx={{ borderColor: "rgba(11,31,42,0.12)" }} />

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Button
                variant="outlined"
                onClick={() => {
                  setFormData({
                    name: microcontroller.name ?? "",
                    description: microcontroller.description ?? "",
                    software_version: microcontroller.software_version ?? "",
                    max_devices: microcontroller.max_devices ?? 4,
                    type: microcontroller.type ?? "raspberry_pi_zero",
                    assigned_sensors: microcontroller.assigned_sensors ?? [],
                  });
                  setFormError(null);
                  setEditOpen(true);
                }}
              >
                {t("admin.microcontrollers.editButton")}
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => setDeleteOpen(true)}
              >
                {t("admin.microcontrollers.deleteButton")}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)}>
        <DialogTitle>{t("admin.microcontrollers.editTitle")}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            {formError && <Alert severity="error">{formError}</Alert>}
            <TextField
              label={t("admin.microcontrollers.fields.name")}
              value={formData.name}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, name: event.target.value }))
              }
              fullWidth
            />
            <TextField
              label={t("admin.microcontrollers.fields.description")}
              value={formData.description}
              onChange={(event) =>
                setFormData((prev) => ({ ...prev, description: event.target.value }))
              }
              fullWidth
            />
            <TextField
              label={t("admin.microcontrollers.fields.software")}
              value={formData.software_version}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  software_version: event.target.value,
                }))
              }
              fullWidth
            />
            <TextField
              label={t("admin.microcontrollers.fields.maxDevices")}
              value={formData.max_devices}
              onChange={(event) =>
                setFormData((prev) => ({
                  ...prev,
                  max_devices: Number(event.target.value),
                }))
              }
              type="number"
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>{t("admin.microcontrollers.fields.type")}</InputLabel>
              <Select
                label={t("admin.microcontrollers.fields.type")}
                value={formData.type}
                onChange={(event) =>
                  setFormData((prev) => ({ ...prev, type: event.target.value }))
                }
              >
                <MenuItem value="raspberry_pi_zero">Raspberry Pi Zero</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>{t("admin.microcontrollers.fields.sensors")}</InputLabel>
              <Select
                label={t("admin.microcontrollers.fields.sensors")}
                multiple
                value={formData.assigned_sensors}
                onChange={(event) =>
                  setFormData((prev) => ({
                    ...prev,
                    assigned_sensors: event.target.value as string[],
                  }))
                }
              >
                {["dht22", "bme280", "bh1750"].map((sensor) => (
                  <MenuItem key={sensor} value={sensor}>
                    {sensor}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>{t("common.cancel")}</Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (!token || !userId || !microcontrollerUuid) return;
              if (!formData.name.trim()) {
                setFormError(t("admin.microcontrollers.errors.nameRequired"));
                return;
              }
              if (formData.assigned_sensors.length === 0) {
                setFormError(t("admin.microcontrollers.errors.sensorsRequired"));
                return;
              }
              setSaving(true);
              try {
                await adminApi.updateMicrocontroller(
                  token,
                  Number(userId),
                  microcontrollerUuid,
                  {
                    name: formData.name.trim(),
                    description: formData.description || null,
                    software_version: formData.software_version || null,
                    max_devices: Number(formData.max_devices),
                    type: formData.type,
                    assigned_sensors: formData.assigned_sensors,
                  }
                );
                setEditOpen(false);
                const res = await adminApi.getMicrocontroller(
                  token,
                  Number(userId),
                  microcontrollerUuid
                );
                setMicrocontroller(res.data ?? null);
              } catch (err) {
                console.error("Failed to update microcontroller", err);
                setFormError(t("admin.errors.loadMicrocontrollers"));
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
          >
            {saving ? <CircularProgress size={20} /> : t("admin.microcontrollers.saveButton")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>{t("admin.microcontrollers.deleteTitle")}</DialogTitle>
        <DialogContent>
          <Typography>
            {t("admin.microcontrollers.deleteConfirm", {
              name: microcontroller.name ?? microcontroller.uuid ?? "-",
            })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>{t("common.cancel")}</Button>
          <Button
            variant="contained"
            color="error"
            onClick={async () => {
              if (!token || !userId || !microcontrollerUuid) return;
              setSaving(true);
              try {
                await adminApi.deleteMicrocontroller(
                  token,
                  Number(userId),
                  microcontrollerUuid
                );
                navigate(`/admin/users/${userId}`);
              } catch (err) {
                console.error("Failed to delete microcontroller", err);
                setFormError(t("admin.errors.loadMicrocontrollers"));
              } finally {
                setSaving(false);
              }
            }}
            disabled={saving}
          >
            {saving ? <CircularProgress size={20} /> : t("admin.microcontrollers.deleteButton")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
