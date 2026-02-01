import { useCallback, useState } from "react";
import type { Device } from "@/features/devices/types/devicesType";
import { devicesApi } from "@/api/devicesApi";

export function useDeviceActions() {
  const [manualSaving, setManualSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const setManualState = useCallback(
    async (deviceId: number, state: boolean) => {
      setManualSaving(true);
      setError(null);
      try {
        const res = await devicesApi.setManualState(deviceId, state);
        return res.data;
      } catch (err) {
        setError(err);
        throw err;
      } finally {
        setManualSaving(false);
      }
    },
    []
  );

  return {
    setManualState,
    manualSaving,
    error,
    clearError: () => setError(null),
  };
}
