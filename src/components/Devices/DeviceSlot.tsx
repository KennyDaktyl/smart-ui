// src/components/Devices/DeviceSlot.tsx

import { useState, useEffect } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  MenuItem,
  IconButton,
  Stack,
  Tooltip,
  Switch,
  Chip,
  CircularProgress,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import CircleIcon from "@mui/icons-material/Circle";

import { deviceApi } from "@/api/deviceApi";
import { useAuth } from "@/hooks/useAuth";

interface DeviceSlotProps {
  raspberryId: number;
  device?: any;
  onSaved: () => void;
}

export function DeviceSlot({ raspberryId, device, onSaved }: DeviceSlotProps) {
  const { token } = useAuth();

  const [editing, setEditing] = useState(!device);
  const [saving, setSaving] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const online = device?.online ?? false;
  const hasLiveState = device?.is_on !== undefined;

  // 🔥 JEDYNY stan, który zmieniamy dynamicznie na live
  const [manualState, setManualState] = useState(
    device?.is_on ?? device?.manual_state ?? false
  );

  // 🔥 Aktualizacja z heartbeat (TYLKO jeśli is_on się zmienia)
  useEffect(() => {
    if (device?.is_on !== undefined) {
      setManualState(device.is_on);
    }
  }, [device?.is_on]);

  // 🔥 Formularz zależy tylko od pól, a nie całego obiektu device
  const [form, setForm] = useState({
    name: device?.name || "",
    rated_power_w: device?.rated_power_w || "",
    mode: device?.mode || "MANUAL",
    gpio_pin: device?.gpio_pin || "",
    power_threshold_w: device?.power_threshold_w || "",
  });

  useEffect(() => {
    setForm({
      name: device?.name || "",
      rated_power_w: device?.rated_power_w || "",
      mode: device?.mode || "MANUAL",
      gpio_pin: device?.gpio_pin || "",
      power_threshold_w: device?.power_threshold_w || "",
    });

    // ❗ NIE resetujemy tutaj manualState, bo to powodowało pętlę!
  }, [device?.name, device?.rated_power_w, device?.mode, device?.gpio_pin, device?.power_threshold_w]);

  const resetForm = () => {
    setForm({
      name: "",
      rated_power_w: "",
      mode: "MANUAL",
      gpio_pin: "",
      power_threshold_w: "",
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    if (!token) return;

    try {
      setSaving(true);
      if (device) {
        await deviceApi.updateDevice(token, device.id, form);
      } else {
        await deviceApi.createDevice(token, { ...form, raspberry_id: raspberryId });
        resetForm();
      }
      onSaved();
      setEditing(false);
    } catch (err) {
      console.error("❌ Błąd zapisu urządzenia:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !device) return;
    if (!confirm(`Czy na pewno chcesz usunąć urządzenie "${device.name}"?`)) return;

    try {
      setSaving(true);
      await deviceApi.deleteDevice(token, device.id);
      onSaved();
    } catch (err) {
      console.error("❌ Błąd usuwania urządzenia:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleManualToggle = async (checked: boolean) => {
    if (!token || !device) return;
    setIsToggling(true);

    try {
      const response = await deviceApi.setManualState(token, device.id, checked);

      if (response.status === 200 || response.status === 201) {
        const ackOk = response.data?.ack?.ok ?? true;
        if (ackOk) {
          setManualState(checked);
        }
      }
    } catch (err) {
      console.error("❌ Błąd zmiany stanu ręcznego:", err);
    } finally {
      setIsToggling(false);
    }
  };

  // --- Widok pustego slotu ---
  if (!device && !editing) {
    return (
      <Card
        sx={{
          border: "2px dashed #aaa",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          py: 3,
          cursor: "pointer",
          "&:hover": { backgroundColor: "#f9f9f9" },
        }}
        onClick={() => setEditing(true)}
      >
        <CardContent sx={{ textAlign: "center" }}>
          <AddIcon fontSize="large" />
          <Typography variant="body2">Dodaj urządzenie</Typography>
        </CardContent>
      </Card>
    );
  }

  // --- Widok edycji ---
  if (editing) {
    return (
      <Card sx={{ p: 1 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1">
              {device ? "Edytuj urządzenie" : "Nowe urządzenie"}
            </Typography>
            <Stack direction="row" spacing={1}>
              <Tooltip title="Zapisz">
                <IconButton color="primary" onClick={handleSave} disabled={saving || !form.name}>
                  <SaveIcon />
                </IconButton>
              </Tooltip>
              <Tooltip title="Anuluj">
                <IconButton color="inherit" onClick={() => setEditing(false)}>
                  <CloseIcon />
                </IconButton>
              </Tooltip>
            </Stack>
          </Stack>

          <Stack spacing={1.5} mt={1.5}>
            <TextField label="Nazwa" fullWidth size="small" name="name" value={form.name} onChange={handleChange} />
            <TextField label="GPIO pin" fullWidth size="small" name="gpio_pin" type="number" value={form.gpio_pin} onChange={handleChange} />
            <TextField label="Moc poboru (W)" fullWidth size="small" name="rated_power_w" type="number" value={form.rated_power_w} onChange={handleChange} />

            <TextField select label="Tryb pracy" fullWidth size="small" name="mode" value={form.mode} onChange={handleChange}>
              <MenuItem value="MANUAL">Ręczny</MenuItem>
              <MenuItem value="AUTO_POWER">Auto (moc PV)</MenuItem>
              <MenuItem value="SCHEDULE">Harmonogram</MenuItem>
            </TextField>

            {form.mode === "AUTO_POWER" && (
              <TextField
                label="Próg mocy produkcji (W)"
                fullWidth
                size="small"
                name="power_threshold_w"
                type="number"
                value={form.power_threshold_w}
                onChange={handleChange}
              />
            )}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  // --- Widok urządzenia ---
  return (
    <Card>
      <CardContent>
        {/* HEADER */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="subtitle1">{device.name}</Typography>

            <Tooltip title={online ? "Online" : "Offline"}>
              <CircleIcon sx={{ fontSize: 12, color: online ? "green" : "grey" }} />
            </Tooltip>
          </Stack>

          <Stack direction="row" spacing={1}>
            <Tooltip title="Edytuj">
              <IconButton color="primary" onClick={() => setEditing(true)}>
                <EditIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Usuń">
              <IconButton color="error" onClick={handleDelete}>
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          </Stack>
        </Stack>

        {/* INFO */}
        <Typography variant="body2" color="text.secondary">
          GPIO: {device.gpio_pin ?? "—"} | Moc: {device.rated_power_w ?? "n/d"} W
        </Typography>

        <Typography variant="body2" color="text.secondary">
          Tryb: {device.mode}
        </Typography>

        {/* STATE SECTION */}
        <Box mt={1.5} display="flex" alignItems="center" justifyContent="space-between">
          {!online ? (
            <Chip label="Stan niedostępny" color="default" size="small" />

          ) : device.mode === "MANUAL" ? (
            !hasLiveState ? (
              <Chip label="Oczekiwanie na dane..." size="small" />
            ) : (
              <Stack direction="row" alignItems="center" spacing={1.5}>
                <Typography variant="body2">Sterowanie:</Typography>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <Switch
                    checked={manualState}
                    onChange={(e) => handleManualToggle(e.target.checked)}
                    color="primary"
                    disabled={isToggling}
                  />
                  {isToggling && (
                    <CircularProgress size={20} thickness={5} color="primary" />
                  )}
                </Stack>

                <Chip
                  label={manualState ? "Włączony" : "Wyłączony"}
                  color={manualState ? "success" : "default"}
                  size="small"
                />
              </Stack>
            )
          ) : (
            <Stack direction="row" spacing={1} alignItems="center">
              <PowerSettingsNewIcon
                sx={{ fontSize: 18, color: hasLiveState && device.is_on ? "green" : "grey" }}
              />
              <Typography variant="body2" color="text.secondary">
                {hasLiveState ? (device.is_on ? "Włączony" : "Wyłączony") : "—"}
              </Typography>
            </Stack>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
