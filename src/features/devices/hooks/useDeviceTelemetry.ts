import { useEffect, useState } from "react";
import type { DeviceEventsResponse } from "@/features/devices/types/deviceEvents";
import { deviceEventsApi } from "@/api/deviceEventsApi";

interface UseDeviceTelemetryArgs {
  deviceId?: number;
  enabled: boolean;
  date: string;
}

export function useDeviceTelemetry({
  deviceId,
  enabled,
  date,
}: UseDeviceTelemetryArgs) {
  const [data, setData] = useState<DeviceEventsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !deviceId) return;

    const fetchTelemetry = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await deviceEventsApi.getDeviceEvents(deviceId, {
          limit: 1000,
          date,
        });

        setData(res.data);
      } catch {
        setError("Failed to load telemetry data");
      } finally {
        setLoading(false);
      }
    };

    fetchTelemetry();
  }, [deviceId, enabled, date]);

  return { data, loading, error };
}
