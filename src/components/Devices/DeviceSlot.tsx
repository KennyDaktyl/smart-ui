import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { deviceApi } from "@/api/deviceApi";
import { useAuth } from "@/hooks/useAuth";

import { EmptySlot } from "./EmptySlot";
import { DeviceForm } from "./DeviceForm";
import { DeviceView } from "./DeviceView";

interface DeviceSlotProps {
  raspberryId: number;
  device?: any;
  slotIndex: number;
  parentOnline: boolean;
  onSaved: () => void;
}

export function DeviceSlot({
  raspberryId,
  device,
  slotIndex,
  parentOnline,
  onSaved,
}: DeviceSlotProps) {
  const { token } = useAuth();

  const [editing, setEditing] = useState(!device);
  const [saving, setSaving] = useState(false);
  const [isToggling, setIsToggling] = useState(false);
  const [manualState, setManualState] = useState(
    device?.is_on ?? device?.manual_state ?? false
  );

  const online = parentOnline && (device?.online ?? false);
  const locked = !parentOnline;

  /**  
   * DEVICE SNAPSHOT – zamrażamy dane urządzenia
   * aby heartbeat NIE niszczył edycji
   */
  const deviceRef = useRef(device);

  useEffect(() => {
    if (!editing) {
      deviceRef.current = device;
    }
  }, [device, editing]);

  /** 
   * MEMO — stabilne dane wejściowe dla formularza 
   * TYLKO z deviceRef.current, nigdy z "device"
   */
  const initialFormData = useMemo(() => {
    const d = deviceRef.current;

    return {
      name: d?.name || "",
      rated_power_kw: d?.rated_power_kw ? d.rated_power_kw : "",
      mode: d?.mode || "MANUAL",
      device_number: d?.device_number || slotIndex,
      threshold_kw: d?.threshold_kw ? d.threshold_kw: "",
    };
  }, [deviceRef.current, slotIndex]);

  /** sync manual state */
  useEffect(() => {
    if (device?.is_on !== undefined) setManualState(device.is_on);
  }, [device?.is_on]);

  /** BUILD PAYLOAD */
  const buildPayload = (form: any) => ({
    name: form.name,
    rated_power_kw: form.rated_power_kw,
    mode: form.mode,
    device_number: form.device_number,
    threshold_kw: form.threshold_kw || null,
    raspberry_id: raspberryId,
  });

  /** SAVE DEVICE */
  const saveDevice = useCallback(
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

        onSaved();
        setEditing(false);
      } catch (err) {
        console.error("Failed to save device:", err);
      } finally {
        setSaving(false);
      }
    },
    [token, device, raspberryId, onSaved]
  );

  /** DELETE DEVICE */
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

  /** MANUAL TOGGLE */
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

  /** RENDER */

  if (!device && !editing)
    return (
      <EmptySlot
        slotIndex={slotIndex}
        locked={locked}
        onAdd={() => setEditing(true)}
      />
    );

  if (editing)
    return (
      <DeviceForm
        initialData={initialFormData}
        locked={locked}
        saving={saving}
        onCancel={() => setEditing(false)}
        onSubmit={saveDevice}
      />
    );

  return (
    <DeviceView
      device={device}
      online={online}
      locked={locked}
      manualState={manualState}
      isToggling={isToggling}
      onEdit={() => setEditing(true)}
      onDelete={handleDelete}
      onToggle={handleManualToggle}
    />
  );
}
