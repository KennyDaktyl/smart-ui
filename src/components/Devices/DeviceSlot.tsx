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
  Switch,
  Chip,
} from "@mui/material";

import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import CloseIcon from "@mui/icons-material/Close";
import CircleIcon from "@mui/icons-material/Circle";

import { deviceApi } from "@/api/deviceApi";
import { useAuth } from "@/hooks/useAuth";

interface DeviceSlotProps {
  raspberryId: number;
  device?: any;
  slotIndex: number;
  parentOnline: boolean;   // 🔥 DODAŁEM TO
  onSaved: () => void;
}

export function DeviceSlot({ raspberryId, device, slotIndex, parentOnline, onSaved }: DeviceSlotProps) {
  const { token } = useAuth();

  const [editing, setEditing] = useState(!device);
  const [saving, setSaving] = useState(false);
  const [isToggling, setIsToggling] = useState(false);

  const online = parentOnline && (device?.online ?? false);  
  // 🔥 jeśli Raspberry offline → device też offline

  const [manualState, setManualState] = useState(
    device?.is_on ?? device?.manual_state ?? false
  );

  useEffect(() => {
    if (device?.is_on !== undefined) setManualState(device.is_on);
  }, [device?.is_on]);

  const [form, setForm] = useState({
    name: device?.name || "",
    rated_power_w: device?.rated_power_w || "",
    mode: device?.mode || "MANUAL",
    device_number: device?.device_number || slotIndex,
    threshold_w: device?.threshold_w || null,
  });

  useEffect(() => {
    setForm({
      name: device?.name || "",
      rated_power_w: device?.rated_power_w || "",
      mode: device?.mode || "MANUAL",
      device_number: device?.device_number || slotIndex,
      threshold_w: device?.threshold_w || null
    });
  }, [
    device?.name,
    device?.rated_power_w,
    device?.mode,
    device?.device_number,
    device?.threshold_w,
    slotIndex,
  ]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    if (!token) return;
    setSaving(true);

    try {
      if (device) {
        await deviceApi.updateDevice(token, device.id, form);
      } else {
        await deviceApi.createDevice(token, {
          ...form,
          raspberry_id: raspberryId,
        });
      }

      onSaved();
      setEditing(false);
    } catch (err) {
      console.error("Failed to save device:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!token || !device) return;
    if (!confirm(`Do you really want to delete device "${device.name}"?`)) return;

    setSaving(true);
    try {
      await deviceApi.deleteDevice(token, device.id);
      onSaved();
    } catch (err) {
      console.error("Failed to delete device:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleManualToggle = async (checked: boolean) => {
    if (!token || !device) return;
    setIsToggling(true);
    try {
      const response = await deviceApi.setManualState(token, device.id, checked);
      if (response.data?.ack?.ok ?? true) setManualState(checked);
    } finally {
      setIsToggling(false);
    }
  };

  /* -----------------------
   *  UI BLOCK: Raspberry offline
   * ---------------------- */
  const locked = !parentOnline;

  /* -----------------------
   * EMPTY SLOT (ADD)
   * ---------------------- */
  if (!device && !editing) {
    return (
      <Card
        sx={{
          border: "2px dashed #aaa",
          textAlign: "center",
          py: 3,
          opacity: locked ? 0.4 : 1,
          cursor: locked ? "not-allowed" : "pointer",
          "&:hover": locked ? {} : { background: "#f0f0f0" },
        }}
        onClick={() => !locked && setEditing(true)}
      >
        <CardContent>
          <AddIcon fontSize="large" />
          <Typography>Dodaj urządzenie (slot {slotIndex})</Typography>
          {locked && (
            <Typography color="error" variant="caption">
              Raspberry offline
            </Typography>
          )}
        </CardContent>
      </Card>
    );
  }

  /* -----------------------
   * EDIT MODE
   * ---------------------- */
  if (editing) {
    return (
      <Card sx={{ p: 1, opacity: locked ? 0.5 : 1 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between">
            <Typography variant="subtitle1">
              {device ? "Edytuj urządzenie" : "Nowe urządzenie"}
            </Typography>

            <Stack direction="row">
              <IconButton onClick={handleSave} disabled={saving || !form.name || locked}>
                <SaveIcon color="primary" />
              </IconButton>

              <IconButton onClick={() => setEditing(false)}>
                <CloseIcon />
              </IconButton>
            </Stack>
          </Stack>

          {locked && (
            <Typography color="error" variant="caption">
              Raspberry jest offline — zapis i edycja zablokowane
            </Typography>
          )}

          <Stack spacing={2} mt={2}>
            <TextField
              label="Nazwa"
              fullWidth
              size="small"
              name="name"
              value={form.name}
              onChange={handleChange}
              disabled={locked}
            />

            <TextField
              label="Moc poboru (W)"
              fullWidth
              size="small"
              name="rated_power_w"
              type="number"
              value={form.rated_power_w}
              onChange={handleChange}
              disabled={locked}
            />

            <TextField
              select
              label="Tryb pracy"
              fullWidth
              size="small"
              name="mode"
              value={form.mode}
              onChange={handleChange}
              disabled={locked}
            >
              <MenuItem value="MANUAL">Ręczny</MenuItem>
              <MenuItem value="AUTO_POWER">Auto moc PV</MenuItem>
              <MenuItem value="SCHEDULE">Harmonogram</MenuItem>
            </TextField>

            <TextField
              label="Slot / Numer urządzenia"
              fullWidth
              size="small"
              name="device_number"
              value={form.device_number}
              InputProps={{ readOnly: true }}
            />

            {form.mode === "AUTO_POWER" && (
              <TextField
                label="Próg mocy PV (W)"
                fullWidth
                size="small"
                name="threshold_w"
                type="number"
                value={form.threshold_w}
                onChange={handleChange}
                disabled={locked}
              />
            )}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  /* -----------------------
   * DEVICE VIEW
   * ---------------------- */
  return (
    <Card sx={{ opacity: locked ? 0.5 : 1 }}>
      <CardContent>
        <Stack direction="row" justifyContent="space-between">
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography>{device.name}</Typography>
            <CircleIcon sx={{ fontSize: 12, color: online ? "green" : "grey" }} />
          </Stack>

          <Stack direction="row" spacing={1}>
            <IconButton onClick={() => !locked && setEditing(true)} disabled={locked}>
              <EditIcon color="primary" />
            </IconButton>

            <IconButton onClick={handleDelete} disabled={locked}>
              <DeleteIcon color="error" />
            </IconButton>
          </Stack>
        </Stack>

        <Typography variant="body2">Slot: {device.device_number}</Typography>
        <Typography variant="body2">Moc: {device.rated_power_w ?? "n/d"} W</Typography>
        <Typography variant="body2">Tryb: {device.mode}</Typography>

        <Box mt={1}>
          {!online ? (
            <Chip label="Offline" size="small" />
          ) : device.mode === "MANUAL" ? (
            <Stack direction="row" spacing={2} alignItems="center">
              <Switch
                checked={manualState}
                onChange={(e) => handleManualToggle(e.target.checked)}
                disabled={isToggling || locked}
              />

              <Chip
                label={manualState ? "Włączony" : "Wyłączony"}
                color={manualState ? "success" : "default"}
                size="small"
              />
            </Stack>
          ) : (
            <Typography variant="body2">
              Stan: {device.is_on ? "Włączony" : "Wyłączony"}
            </Typography>
          )}
        </Box>

        {locked && (
          <Typography color="error" variant="caption">
            Raspberry offline — sterowanie niedostępne
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}
