// src/components/Devices/DeviceSlot.tsx

import { useState, useCallback, useMemo } from "react";
import { deviceApi } from "@/api/deviceApi";
import { useAuth } from "@/hooks/useAuth";

import { EmptySlot } from "./EmptySlot";
import { DeviceForm } from "./DeviceForm";
import { DeviceBox } from "./DeviceBox"; // <-- nowy stabilny box

interface DeviceSlotProps {
  raspberryId: number;
  device?: any;
  slotIndex: number;
  liveInitialized: boolean;
  onRefresh: () => void;
}

export function DeviceSlot({
  raspberryId,
  device,
  slotIndex,
  liveInitialized,
  onRefresh,
}: DeviceSlotProps) {
  const { token } = useAuth();

  // HOOKI MUSZĄ BYĆ ZAWSZE PIERWSZE
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [localIsOn, setLocalIsOn] = useState<boolean | null>(null);

  const locked = false;

  /* ------------------------------------------------------------
   * OBLICZENIA (hooki + memo)
   * ------------------------------------------------------------ */

  const requiresHeartbeat = device?.mode !== "MANUAL";

  const effectiveOnline = liveInitialized ? device?.online ?? false : false;

  const effectiveIsOn = useMemo(() => {
    if (!device) return false;

    if (requiresHeartbeat) {
      return liveInitialized ? device.is_on : false;
    }
    return localIsOn !== null ? localIsOn : device.is_on;
  }, [device, requiresHeartbeat, liveInitialized, localIsOn]);

  const waitingForState = !liveInitialized;

  /* ------------------------------------------------------------
   * HANDLERY
   * ------------------------------------------------------------ */

  const handleSave = useCallback(
    async (form: any) => {
      if (!token) return;

      setSaving(true);
      try {
        const payload = {
          name: form.name,
          rated_power_kw: Number(form.rated_power_kw),
          mode: form.mode,
          device_number: slotIndex,
          threshold_kw: form.threshold_kw ? Number(form.threshold_kw) : null,
          raspberry_id: raspberryId,
        };

        if (device) {
          await deviceApi.updateDevice(token, device.id, payload);
        } else {
          await deviceApi.createDevice(token, payload);
        }

        onRefresh();
        setEditing(false);
      } finally {
        setSaving(false);
      }
    },
    [token, device, raspberryId, slotIndex, onRefresh]
  );

  const handleDelete = useCallback(async () => {
    if (!token || !device) return;
    if (!confirm(`Czy usunąć urządzenie "${device.name}"?`)) return;

    setSaving(true);
    try {
      await deviceApi.deleteDevice(token, device.id);
      onRefresh();
    } finally {
      setSaving(false);
    }
  }, [token, device, onRefresh]);

  const handleToggle = useCallback(
    async (checked: boolean) => {
      if (!token || !device) return;

      setToggling(true);

      try {
        await deviceApi.setManualState(token, device.id, checked);

        if (device.mode === "MANUAL") {
          setLocalIsOn(checked); // UI instant update
        }
      } finally {
        setToggling(false);
      }
    },
    [token, device]
  );

  /* ------------------------------------------------------------
   * RENDER WARUNKOWY – BEZ HOOKÓW NIŻEJ
   * ------------------------------------------------------------ */

  // 1) SLOT PUSTY
  if (!device && !editing) {
    return <EmptySlot slotIndex={slotIndex} onAdd={() => setEditing(true)} />;
  }

  // 2) FORMULARZ
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

  // 3) BOX WIDOKU URZĄDZENIA
  return (
    <DeviceBox
      device={device}
      online={effectiveOnline}
      isOn={effectiveIsOn}
      waitingForState={waitingForState}
      slotIndex={slotIndex}
      toggling={toggling}

      onEdit={() => setEditing(true)}
      onDelete={handleDelete}
      onToggle={handleToggle}
      locked={locked}
    />
  );
}
