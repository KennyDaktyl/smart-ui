import { useState, useCallback } from "react";
import { Box, Stack, CircularProgress, Typography } from "@mui/material";

import { deviceApi } from "@/api/deviceApi";
import { useAuth } from "@/hooks/useAuth";

import { EmptySlot } from "./EmptySlot";
import { DeviceForm } from "./DeviceForm";
import { DeviceView } from "./DeviceView";

interface DeviceSlotProps {
  raspberryId: number;
  device?: any;
  slotIndex: number;
  online: boolean;        // status z heartbeat
  isOn: boolean;          // stan ON/OFF z heartbeat
  liveInitialized: boolean;
}

export function DeviceSlot({
  raspberryId,
  device,
  slotIndex,
  online,
  isOn,
  liveInitialized,
}: DeviceSlotProps) {
  const { token } = useAuth();

  const [editing, setEditing] = useState(!device);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);

  const locked = !online;


  /* ------------------------------------------------------------
   * SAVE / DELETE / TOGGLE
   * ------------------------------------------------------------ */

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
      const payload = buildPayload(form);

      try {
        if (device) {
          await deviceApi.updateDevice(token, device.id, payload);
        } else {
          await deviceApi.createDevice(token, payload);
        }
        window.location.reload();
      } catch (err) {
        console.error("Failed to save device:", err);
      } finally {
        setSaving(false);
      }
    },
    [token, device, raspberryId]
  );

  const handleDelete = async () => {
    if (!token || !device) return;

    if (!confirm(`Czy na pewno chcesz usunąć urządzenie "${device.name}"?`))
      return;

    setSaving(true);
    try {
      await deviceApi.deleteDevice(token, device.id);
      window.location.reload();
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
    } catch (err) {
      console.error("Failed to toggle device:", err);
    } finally {
      setToggling(false);
    }
  };

  /* ------------------------------------------------------------
   * 1️⃣ PUSTY SLOT
   * ------------------------------------------------------------ */
  if (!device && !editing) {
    return <EmptySlot slotIndex={slotIndex} onAdd={() => setEditing(true)} />;
  }

  /* ------------------------------------------------------------
   * 2️⃣ FORMULARZ EDYCJI
   * ------------------------------------------------------------ */
  if (editing) {
    return (
      <DeviceForm
        initialData={{
          name: device?.name || "",
          rated_power_kw: device?.rated_power_kw || "",
          mode: device?.mode || "MANUAL",
          threshold_kw: device?.threshold_kw || "",
          device_number: slotIndex,
        }}
        saving={saving}
        locked={locked}
        onCancel={() => setEditing(false)}
        onSubmit={handleSave}
      />
    );
  }

  const statusBlock = liveInitialized ? (
    <DeviceView
      device={device}
      online={online}
      isOn={isOn}
      slotIndex={slotIndex}
      toggling={toggling}
      onEdit={() => setEditing(true)}
      onDelete={handleDelete}
      onToggle={handleToggle}
      locked={locked}
    />
  ) : (
    // 🔥 UI statyczne + spinner statusu
    <Box
      sx={{
        p: 2,
        borderRadius: 2,
        border: "1px solid #ddd",
        bgcolor: "#fafafa",
      }}
    >
      <Typography fontWeight={600}>{device.name}</Typography>
      <Typography variant="body2">Slot: {slotIndex}</Typography>
      <Typography variant="body2">Moc: {device.rated_power_kw} kW</Typography>
      <Typography variant="body2">Tryb: {device.mode}</Typography>

      {device.mode === "AUTO_POWER" && (
        <Typography variant="body2" sx={{ mt: 1 }}>
          Próg PV: {device.threshold_kw} kW
        </Typography>
      )}

      <Stack direction="row" spacing={1} alignItems="center" mt={2}>
        <CircularProgress size={16} />
        <Typography variant="body2" color="text.secondary">
          Oczekiwanie na status urządzenia…
        </Typography>
      </Stack>
    </Box>
  );

  return statusBlock;
}
