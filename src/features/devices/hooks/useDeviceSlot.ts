import { useState, useCallback, useMemo } from "react";
import { deviceApi } from "@/api/deviceApi";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useTranslation } from "react-i18next";

interface UseDeviceSlotParams {
  device?: any;
  raspberryId: number;
  slotIndex: number;
  liveInitialized: boolean;
  onRefresh: () => void;
}

export function useDeviceSlot({
  device,
  raspberryId,
  slotIndex,
  liveInitialized,
  onRefresh,
}: UseDeviceSlotParams) {
  const { token } = useAuth();
  const { t } = useTranslation();

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [localIsOn, setLocalIsOn] = useState<boolean | null>(null);

  const locked = false;
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
    if (!confirm(t("devices.deleteConfirm", { name: device.name }))) return;

    setSaving(true);
    try {
      await deviceApi.deleteDevice(token, device.id);
      onRefresh();
    } finally {
      setSaving(false);
    }
  }, [token, device, onRefresh, t]);

  const handleToggle = useCallback(
    async (checked: boolean) => {
      if (!token || !device) return;

      setToggling(true);

      try {
        await deviceApi.setManualState(token, device.id, checked);

        if (device.mode === "MANUAL") {
          setLocalIsOn(checked);
        }
      } finally {
        setToggling(false);
      }
    },
    [token, device]
  );

  return {
    editing,
    saving,
    toggling,
    locked,
    effectiveOnline,
    effectiveIsOn,
    waitingForState,

    setEditing,
    handleSave,
    handleDelete,
    handleToggle,
  };
}
