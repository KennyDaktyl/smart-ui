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
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import PowerIcon from "@mui/icons-material/Bolt";
import SensorsIcon from "@mui/icons-material/Sensors";
import MemoryIcon from "@mui/icons-material/Memory";
import { useTranslation } from "react-i18next";

import { adminApi } from "@/api/adminApi";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { AdminUserDetails } from "@/features/admin/types";

export default function AdminUserDetailsPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { token } = useAuth();
  const { t, i18n } = useTranslation();

  const [user, setUser] = useState<AdminUserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeMicrocontroller, setActiveMicrocontroller] = useState<any | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    software_version: "",
    max_devices: 4,
    type: "raspberry_pi_zero",
    assigned_sensors: [] as string[],
  });

  const locale = useMemo(
    () => (i18n.language === "pl" ? "pl-PL" : "en-US"),
    [i18n.language]
  );

  const loadUser = async () => {
    if (!token || !userId) return;
    setLoading(true);
    try {
      const res = await adminApi.getUserDetails(token, Number(userId));
      setUser(res.data);
      setError("");
    } catch (err) {
      console.error("Failed to load user details", err);
      setError(t("admin.errors.loadUserDetails"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, [token, userId, t]);

  useEffect(() => {
    const wantsAdd = searchParams.get("addMicrocontroller") === "1";
    if (wantsAdd && user) {
      openAddMicrocontroller();
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, user, setSearchParams]);

  const sensorOptions = ["dht22", "bme280", "bh1750"];

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      software_version: "",
      max_devices: 4,
      type: "raspberry_pi_zero",
      assigned_sensors: [],
    });
    setFormError(null);
  };

  const openAddMicrocontroller = () => {
    resetForm();
    setAddOpen(true);
  };

  const openEditMicrocontroller = (mc: any) => {
    setActiveMicrocontroller(mc);
    setFormData({
      name: mc.name ?? "",
      description: mc.description ?? "",
      software_version: mc.software_version ?? "",
      max_devices: mc.max_devices ?? 4,
      type: mc.type ?? "raspberry_pi_zero",
      assigned_sensors: mc.assigned_sensors ?? [],
    });
    setFormError(null);
    setEditOpen(true);
  };

  const openDeleteMicrocontroller = (mc: any) => {
    setActiveMicrocontroller(mc);
    setDeleteOpen(true);
  };

  const handleSaveMicrocontroller = async () => {
    if (!token || !userId) return;
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
      if (editOpen && activeMicrocontroller) {
        await adminApi.updateMicrocontroller(
          token,
          Number(userId),
          activeMicrocontroller.uuid,
          {
            name: formData.name.trim(),
            description: formData.description || null,
            software_version: formData.software_version || null,
            max_devices: Number(formData.max_devices),
            type: formData.type,
            assigned_sensors: formData.assigned_sensors,
          }
        );
      } else {
        await adminApi.createMicrocontroller(token, Number(userId), {
          name: formData.name.trim(),
          description: formData.description || null,
          software_version: formData.software_version || null,
          max_devices: Number(formData.max_devices),
          type: formData.type,
          assigned_sensors: formData.assigned_sensors,
        });
      }
      setAddOpen(false);
      setEditOpen(false);
      setActiveMicrocontroller(null);
      await loadUser();
    } catch (err) {
      console.error("Failed to save microcontroller", err);
      setFormError(t("admin.errors.loadMicrocontrollers"));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteMicrocontroller = async () => {
    if (!token || !userId || !activeMicrocontroller) return;
    setSaving(true);
    try {
      await adminApi.deleteMicrocontroller(
        token,
        Number(userId),
        activeMicrocontroller.uuid
      );
      setDeleteOpen(false);
      setActiveMicrocontroller(null);
      await loadUser();
    } catch (err) {
      console.error("Failed to delete microcontroller", err);
      setFormError(t("admin.errors.loadMicrocontrollers"));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" height="70vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !user) {
    return (
      <Box p={3}>
        <Alert severity="error">
          {error || t("admin.errors.loadUserDetails")}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      p={{ xs: 2, md: 4 }}
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(15,139,111,0.16), transparent 48%), radial-gradient(circle at bottom right, rgba(17,61,78,0.2), transparent 45%), linear-gradient(180deg, #081824 0%, #0b1f2a 40%, #081824 100%)",
      }}
    >
      {/* BACK */}
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate("/admin")}
        sx={{
          mb: 2.5,
          borderColor: "rgba(255,255,255,0.35)",
          color: "#e8f1f8",
        }}
        variant="outlined"
      >
        {t("admin.backToList")}
      </Button>

      {/* USER HEADER */}
      <Card
        sx={{
          mb: 3,
          borderRadius: 3,
          border: "1px solid rgba(13,27,42,0.12)",
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(245,249,248,0.94) 100%)",
          color: "#0b1f2a",
          boxShadow: "0 18px 42px rgba(8,24,36,0.2)",
        }}
      >
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="h5" fontWeight={700} sx={{ color: "#0b1f2a" }}>
              {user.email}
            </Typography>

            <Typography variant="body2" sx={{ color: "rgba(11,31,42,0.62)" }}>
              Konto od:{" "}
              {new Date(user.created_at).toLocaleDateString(locale)}
            </Typography>

            <Stack direction="row" spacing={1}>
              <Chip label={`Rola: ${user.role}`} color="primary" />
              <Chip
                label={user.is_active ? "Aktywny" : "Nieaktywny"}
                color={user.is_active ? "success" : "default"}
              />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {/* MICROCONTROLLERS */}
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1}
        mb={1.5}
      >
        <Typography
          variant="h6"
          sx={{ color: "#e8f1f8", fontWeight: 700 }}
        >
          Mikrokontrolery użytkownika
        </Typography>
        <Button
          variant="contained"
          onClick={openAddMicrocontroller}
          sx={{
            backgroundColor: "#0f8b6f",
            "&:hover": { backgroundColor: "#0b7a61" },
          }}
        >
          {t("admin.microcontrollers.addButton")}
        </Button>
      </Stack>

      {user.microcontrollers.length === 0 ? (
        <Typography sx={{ color: "rgba(232,241,248,0.7)" }}>
          Brak przypisanych mikrokontrolerów
        </Typography>
      ) : (
        user.microcontrollers.map((mc) => (
          <Card
            key={mc.uuid}
            sx={{
              mb: 2,
              borderRadius: 3,
              border: "1px solid rgba(13,27,42,0.12)",
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.96) 0%, rgba(245,249,248,0.94) 100%)",
              color: "#0b1f2a",
              boxShadow: "0 12px 32px rgba(8,24,36,0.16)",
            }}
          >
            <CardContent>
              <Stack spacing={1.5}>
                {/* HEADER */}
                <Stack direction="row" justifyContent="space-between">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <MemoryIcon sx={{ color: "#0f8b6f" }} />
                    <Typography fontWeight={700} sx={{ color: "#0b1f2a" }}>
                      {mc.name || mc.uuid}
                    </Typography>
                  </Stack>

                  <Chip
                    size="small"
                    label={mc.enabled ? "Aktywny" : "Wyłączony"}
                    color={mc.enabled ? "success" : "default"}
                  />
                </Stack>

                <Typography variant="body2" sx={{ color: "rgba(11,31,42,0.62)" }}>
                  UUID: {mc.uuid}
                </Typography>

                <Typography variant="body2" sx={{ color: "rgba(11,31,42,0.62)" }}>
                  Wersja softu: {mc.software_version || "-"}
                </Typography>

                {/* ACTIVE PROVIDER */}
                {mc.active_provider && (
                  <>
                    <Divider />
                    <Stack direction="row" spacing={1} alignItems="center">
                      <PowerIcon color="warning" />
                      <Typography fontWeight={600} sx={{ color: "#0b1f2a" }}>
                        {t("admin.microcontrollers.activeProvider")}
                      </Typography>
                    </Stack>

                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        backgroundColor: "rgba(255,255,255,0.04)",
                      }}
                    >
                      <Typography fontWeight={600}>
                        {mc.active_provider.name}
                      </Typography>
                      {mc.active_provider.vendor && (
                        <Typography variant="body2" sx={{ color: "rgba(11,31,42,0.62)" }}>
                          Vendor: {mc.active_provider.vendor}
                        </Typography>
                      )}
                      {mc.active_provider.value_min != null && mc.active_provider.value_max != null && (
                        <Typography variant="body2" sx={{ color: "rgba(11,31,42,0.62)" }}>
                          Zakres: {mc.active_provider.value_min}–{mc.active_provider.value_max}{" "}
                          {mc.active_provider.unit}
                        </Typography>
                      )}
                    </Box>
                  </>
                )}

                {/* SENSOR PROVIDERS */}
                {mc.available_sensor_providers?.length > 0 && (
                  <>
                    <Divider />
                    <Stack direction="row" spacing={1} alignItems="center">
                      <SensorsIcon color="info" />
                      <Typography fontWeight={600} sx={{ color: "#0b1f2a" }}>
                        Providery sensorów
                      </Typography>
                    </Stack>

                    <Stack spacing={1}>
                      {mc.available_sensor_providers.map((sp: any) => (
                        <Box
                          key={sp.uuid}
                          sx={{
                            p: 1.25,
                            borderRadius: 2,
                            backgroundColor: "rgba(255,255,255,0.04)",
                          }}
                        >
                          <Typography fontWeight={600}>
                            {sp.name}
                          </Typography>
                          <Typography variant="body2" sx={{ color: "rgba(11,31,42,0.62)" }}>
                            Typ: {sp.kind} · {sp.unit}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </>
                )}

                {/* ACTIONS */}
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} mt={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => navigate(`/admin/users/${userId}/microcontrollers/${mc.uuid}`)}
                  >
                    {t("admin.microcontrollers.detailsButton")}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => openEditMicrocontroller(mc)}
                  >
                    {t("admin.microcontrollers.editButton")}
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color="error"
                    onClick={() => openDeleteMicrocontroller(mc)}
                  >
                    {t("admin.microcontrollers.deleteButton")}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        ))
      )}

      <Dialog open={addOpen || editOpen} onClose={() => setAddOpen(false)}>
        <DialogTitle>
          {editOpen
            ? t("admin.microcontrollers.editTitle")
            : t("admin.microcontrollers.addTitle")}
        </DialogTitle>
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
                {sensorOptions.map((sensor) => (
                  <MenuItem key={sensor} value={sensor}>
                    {sensor}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setAddOpen(false);
              setEditOpen(false);
              setActiveMicrocontroller(null);
            }}
          >
            {t("common.cancel")}
          </Button>
          <Button variant="contained" onClick={handleSaveMicrocontroller} disabled={saving}>
            {saving ? <CircularProgress size={20} /> : t("admin.microcontrollers.saveButton")}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>{t("admin.microcontrollers.deleteTitle")}</DialogTitle>
        <DialogContent>
          <Typography>
            {t("admin.microcontrollers.deleteConfirm", {
              name: activeMicrocontroller?.name ?? activeMicrocontroller?.uuid ?? "-",
            })}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>{t("common.cancel")}</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleDeleteMicrocontroller}
            disabled={saving}
          >
            {saving ? <CircularProgress size={20} /> : t("admin.microcontrollers.deleteButton")}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
