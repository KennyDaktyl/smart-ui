import { useState, useCallback, useMemo } from "react";
import { deviceApi } from "@/api/deviceApi";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useTranslation } from "react-i18next";
import type { DeviceFormData } from "@/features/devices/types/device";
import { mapUIModeToApi } from "@/features/devices/types/device.mappers";

interface UseDeviceSlotParams {
  device?: any;
  raspberryId: number;
  raspberryUuid: string;
  slotIndex: number;
  liveInitialized: boolean;
  onRefresh: () => void;
}

export function useDeviceSlot({
  device,
  raspberryId,
  raspberryUuid,
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
    async (form: DeviceFormData | null) => {
      if (!form) return;
      if (!token || !raspberryUuid) return;

      setSaving(true);
      try {
        const ratedPowerValue =
          form.rated_power_w === "" ? null : Number(form.rated_power_w);
        const thresholdValue =
          form.threshold_value === "" ? null : Number(form.threshold_value);

        const payload: Record<string, any> = {
          name: form.name,
          mode: mapUIModeToApi(form.mode),
          device_number: slotIndex,
        };

        if (ratedPowerValue !== null) {
          payload.rated_power_w = ratedPowerValue;
        }

        if (thresholdValue !== null) {
          payload.threshold_value = thresholdValue;
        }

        if (device) {
          await deviceApi.updateDevice(token, raspberryUuid, device.id, payload);
        } else {
          await deviceApi.createDevice(token, raspberryUuid, payload);
        }

        onRefresh();
        setEditing(false);
      } finally {
        setSaving(false);
      }
    },
    [token, device, raspberryUuid, slotIndex, onRefresh]
  );

  const handleDelete = useCallback(async () => {
    if (!token || !device || !raspberryUuid) return;
    if (!confirm(t("devices.deleteConfirm", { name: device.name }))) return;

    setSaving(true);
    try {
      await deviceApi.deleteDevice(token, raspberryUuid, device.id);
      onRefresh();
    } finally {
      setSaving(false);
    }
  }, [token, device, raspberryUuid, onRefresh, t]);

  const handleToggle = useCallback(
    async (checked: boolean) => {
      if (!token || !device || !raspberryUuid) return;

      setToggling(true);

      try {
        const response = await deviceApi.setManualState(
          token,
          device.id,
          checked,
          raspberryUuid
        );
        const isSuccess = response?.status >= 200 && response.status < 300;

        if (device.mode === "MANUAL" && isSuccess) {
          setLocalIsOn(checked);
        }
      } catch (error) {
        console.error("Failed to change manual state", error);
      } finally {
        setToggling(false);
      }
    },
    [token, device, raspberryUuid]
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
