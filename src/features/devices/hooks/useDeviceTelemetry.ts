import { useEffect, useState } from "react";
import type { DeviceEventsResponse } from "@/features/devices/types/deviceEvents";
import { deviceEventsApi } from "@/api/deviceEventsApi";

interface UseDeviceTelemetryArgs {
  deviceId?: number;
  enabled: boolean;
  start: string;
  end: string;
}

export function useDeviceTelemetry({
  deviceId,
  enabled,
  start,
  end,
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
          date_start: start,
          date_end: end,
        });

        setData(res.data);
      } catch {
        setError("Failed to load telemetry data");
      } finally {
        setLoading(false);
      }
    };

    fetchTelemetry();
  }, [deviceId, enabled, start, end]);

  return { data, loading, error };
}
