import { useCallback, useMemo, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";

import { Microcontroller, PowerUnit } from "../components/types";
import { DeviceUIMode } from "@/features/devices/types/device";
import { microcontrollerApi } from "@/api/microcontrollerApi";
import { mapUIModeToApi } from "@/features/devices/types/device.mappers";

type UseDeviceDialogParams = {
  token: string | null;
  onReload(): Promise<void> | void;
};

function computeNextDeviceNumber(mc: Microcontroller): number {
  return Array.isArray(mc.devices) && mc.devices.length > 0 ? mc.devices.length + 1 : 1;
}

export function useDeviceDialog({ token, onReload }: UseDeviceDialogParams) {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);
  const [microcontroller, setMicrocontroller] = useState<Microcontroller | null>(null);

  const [deviceName, setDeviceName] = useState("");
  const [deviceMode, setDeviceMode] = useState<DeviceUIMode>(DeviceUIMode.MANUAL);
  const [deviceRatedPower, setDeviceRatedPower] = useState("");
  const [autoThreshold, setAutoThreshold] = useState<number>(0);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseError = useCallback(
    (err: unknown) => {
      if (!axios.isAxiosError(err)) return t("common.errors.generic");
      const status = err.response?.status;
      if (status === 401) return t("common.errors.sessionExpired");
      if (status === 422) return t("common.errors.invalidInput");
      if (status === 500) return t("common.errors.serverError");
      return t("common.errors.requestFailed");
    },
    [t]
  );

  const openDialog = useCallback((mc: Microcontroller) => {
    setMicrocontroller(mc);

    setDeviceName("");
    setDeviceMode(DeviceUIMode.MANUAL);
    setDeviceRatedPower("");

    setAutoThreshold(mc.active_provider?.value_min ?? 0);

    setError(null);
    setOpen(true);
  }, []);

  const closeDialog = useCallback(() => setOpen(false), []);

  const save = useCallback(async () => {
    if (!token || !microcontroller) return;

    if (!deviceName.trim()) {
      setError(t("devices.form.errors.nameRequired"));
      return;
    }

    const provider = microcontroller.active_provider ?? null;

    const providerMin = provider?.value_min ?? null;
    const providerMax = provider?.value_max ?? null;

    const canUseAuto =
      providerMin !== null && providerMax !== null && providerMin < providerMax;

    if (deviceMode === DeviceUIMode.AUTO_POWER && !canUseAuto) {
      setError(t("microcontrollers.deviceAutoThresholdUnavailable"));
      return;
    }

    const unit = provider?.unit ?? PowerUnit.WATT;

    const ratedPowerW =
      deviceRatedPower.trim() === ""
        ? null
        : unit === PowerUnit.KILOWATT
          ? Number(deviceRatedPower) * 1000
          : Number(deviceRatedPower);

    const nextDeviceNumber = computeNextDeviceNumber(microcontroller);

    try {
      setSaving(true);
      setError(null);

      const createRes = await microcontrollerApi.createDevice(token, microcontroller.uuid, {
        name: deviceName.trim(),
        device_number: nextDeviceNumber,
        mode: mapUIModeToApi(deviceMode),
        rated_power_w: ratedPowerW,
      });

      const deviceId = createRes.data?.id as number | undefined;
      if (!deviceId) {
        throw new Error("Device ID missing after creation");
      }

      if (deviceMode === DeviceUIMode.AUTO_POWER && provider) {
        await microcontrollerApi.createDeviceAutoConfig(token, microcontroller.uuid, deviceId, {
          provider_id: provider.id,
          comparison: ">=",
          threshold_value: autoThreshold,
          enabled: true,
        });
      }

      await onReload();
      setOpen(false);
    } catch (e) {
      setError(parseError(e));
    } finally {
      setSaving(false);
    }
  }, [
    token,
    microcontroller,
    deviceName,
    deviceMode,
    deviceRatedPower,
    autoThreshold,
    t,
    parseError,
    onReload,
  ]);

  return useMemo(
    () => ({
      dialog: {
        open,
        microcontroller,
        deviceName,
        deviceMode,
        deviceRatedPower,
        autoThreshold,
        saving,
        error,
      },
      actions: {
        openDialog,
        closeDialog,
        setDeviceName,
        setDeviceMode,
        setDeviceRatedPower,
        setAutoThreshold,
        save,
      },
    }),
    [
      open,
      microcontroller,
      deviceName,
      deviceMode,
      deviceRatedPower,
      autoThreshold,
      saving,
      error,
      openDialog,
      closeDialog,
      save,
    ]
  );
}
