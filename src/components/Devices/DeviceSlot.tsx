import { useState, useCallback } from "react";
import {
  Paper,
  Stack,
  Typography,
  IconButton,
  CircularProgress,
  Switch,
} from "@mui/material";

import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";

import { deviceApi } from "@/api/deviceApi";
import { useAuth } from "@/hooks/useAuth";

import { EmptySlot } from "./EmptySlot";
import { DeviceForm } from "./DeviceForm";

interface DeviceSlotProps {
  raspberryId: number;
  device?: any;
  slotIndex: number;
  online: boolean;
  isOn: boolean;
  liveInitialized: boolean;
  onRefresh: () => void;
}

export function DeviceSlot({
  raspberryId,
  device,
  slotIndex,
  online,
  isOn,
  liveInitialized,
  onRefresh,
}: DeviceSlotProps) {
  const { token } = useAuth();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [localIsOn, setLocalIsOn] = useState<boolean | null>(null);

  const locked = false;

  /* ----------------------------------------------------------------------------
   * HELPERS & ACTION HANDLERS
   * --------------------------------------------------------------------------*/

  const buildPayload = (form: any) => ({
    name: form.name,
    rated_power_kw: Number(form.rated_power_kw),
    mode: form.mode,
    device_number: slotIndex,
    threshold_kw: form.threshold_kw ? Number(form.threshold_kw) : null,
    raspberry_id: raspberryId,
  });

  const handleSave = useCallback(
    async (form: any) => {
      if (!token) return;
      setSaving(true);

      try {
        const payload = buildPayload(form);

        if (device) {
          await deviceApi.updateDevice(token, device.id, payload);
        } else {
          await deviceApi.createDevice(token, payload);
        }

        onRefresh();
        setEditing(false);
      } catch (err) {
        console.error("Failed to save device:", err);
      } finally {
        setSaving(false);
      }
    },
    [token, device, raspberryId, onRefresh]
  );

  const handleDelete = async () => {
    if (!token || !device) return;

    if (!confirm(`Czy na pewno chcesz usunąć urządzenie "${device.name}"?`)) return;

    setSaving(true);
    try {
      await deviceApi.deleteDevice(token, device.id);
      onRefresh();
    } catch (err) {
      console.error("Failed to delete device:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (checked: boolean) => {
    if (!token || !device) return;

    setToggling(true);

    try {
      await deviceApi.setManualState(token, device.id, checked);

      if (device.mode === "MANUAL") {
        setLocalIsOn(checked); // NATYCHMIASTOWY UI UPDATE
      }

    } catch (err) {
      console.error("Failed to toggle device:", err);
    } finally {
      setToggling(false);
    }
  };

  /* ----------------------------------------------------------------------------
   * EARLY RETURNS
   * --------------------------------------------------------------------------*/

  if (!device && !editing) {
    return <EmptySlot slotIndex={slotIndex} onAdd={() => setEditing(true)} />;
  }

  if (editing) {
    return (
      <DeviceForm
        initialData={{
          name: device?.name ?? "",
          rated_power_kw: device?.rated_power_kw ?? "",
          mode: device?.mode ?? "MANUAL",
          threshold_kw: device?.threshold_kw ?? "",
          device_number: slotIndex,
        }}
        saving={saving}
        locked={locked}
        onCancel={() => setEditing(false)}
        onSubmit={handleSave}
      />
    );
  }

  /* ----------------------------------------------------------------------------
   * NOW SAFE → DEVICE EXISTS BELOW THIS LINE  
   * --------------------------------------------------------------------------*/

  const requiresHeartbeat = device.mode !== "MANUAL";

  const waitingForState = !liveInitialized;

  const effectiveOnline = liveInitialized ? online : false;

  const effectiveIsOn = requiresHeartbeat
    ? (liveInitialized ? isOn : false)
    : (localIsOn !== null ? localIsOn : (liveInitialized ? isOn : false));

  /* ----------------------------------------------------------------------------
   * VIEW MODE
   * --------------------------------------------------------------------------*/

  return (
    <Paper
      elevation={3}
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid #e0e0e0",
      }}
    >
      {/* HEADER */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6" fontWeight={600}>
          {device.name}
        </Typography>

        <Stack direction="row" spacing={1}>
          <IconButton onClick={() => setEditing(true)} size="small">
            <EditIcon fontSize="small" />
          </IconButton>

          <IconButton onClick={handleDelete} size="small" color="error">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>

      {/* INFO */}
      <Typography variant="body2" color="text.secondary">
        Slot: {slotIndex}
      </Typography>

      <Typography variant="body2" color="text.secondary">
        Moc: {device.rated_power_kw} kW
      </Typography>

      {device.mode === "AUTO_POWER" && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          Próg PV: {device.threshold_kw} kW
        </Typography>
      )}

      {/* STATUS + TOGGLE */}
      <Stack direction="row" spacing={2} alignItems="center" mt={2}>
        {waitingForState ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <CircularProgress size={16} />
            <Typography variant="body2" color="text.secondary">
              Oczekiwanie na status…
            </Typography>
          </Stack>
        ) : (
          <Typography
            variant="body2"
            fontWeight={600}
            color={effectiveOnline ? "green" : "red"}
          >
            {effectiveOnline ? "Online" : "Offline"}
          </Typography>
        )}

        {/* TRYB AUTO → BRAK SWITCHA, TYLKO STAN INFORMACYJNY */}
        {device.mode !== "MANUAL" ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <PowerSettingsNewIcon
              fontSize="small"
              color={effectiveIsOn ? "success" : "disabled"}
            />

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                px: 1.2,
                py: 0.5,
                bgcolor: effectiveIsOn ? "#c8f7c5" : "#eee",
                borderRadius: 2,
              }}
            >
              ⚡ {effectiveIsOn ? "Włączony" : "Wyłączony"}
            </Typography>
          </Stack>
        ) : (
          <Switch
            checked={effectiveIsOn}
            disabled={!effectiveOnline || toggling}
            onChange={(e) => handleToggle(e.target.checked)}
          />
        )}
        </Stack>
      </Paper>
    );
}
