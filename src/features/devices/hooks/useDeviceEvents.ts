import { useEffect, useState } from "react";

import { deviceEventsApi } from "@/api/deviceEventsApi";
import { DeviceEventsSummary, DeviceTimelineEvent } from "@/features/devices/types/deviceEvents";

interface UseDeviceEventsOptions {
  token?: string | null;
  deviceId?: number | null;
  rangeStart?: string;
  rangeEnd?: string;
  enabled?: boolean;
  errorMessage: string;
}

interface UseDeviceEventsResult {
  events: DeviceTimelineEvent[];
  summary: DeviceEventsSummary;
  loading: boolean;
  error: string | null;
}

export function useDeviceEvents({
  token,
  deviceId,
  rangeStart,
  rangeEnd,
  enabled = true,
  errorMessage,
}: UseDeviceEventsOptions): UseDeviceEventsResult {
  const [events, setEvents] = useState<DeviceTimelineEvent[]>([]);
  const [summary, setSummary] = useState<DeviceEventsSummary>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !deviceId || !rangeStart || !rangeEnd || !enabled) return;

    let cancelled = false;

    const fetchEvents = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await deviceEventsApi.getDeviceEvents(
          token,
          deviceId,
          new Date(rangeStart).toISOString(),
          new Date(rangeEnd).toISOString()
        );
        if (cancelled) return;

        setEvents(res.data?.events ?? []);
        setSummary({
          total_minutes_on: res.data?.total_minutes_on,
          energy_kwh: res.data?.energy_kwh,
          rated_power_kw: res.data?.rated_power_kw,
        });
      } catch {
        if (cancelled) return;
        setError(errorMessage);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchEvents();

    return () => {
      cancelled = true;
    };
  }, [token, deviceId, rangeStart, rangeEnd, enabled, errorMessage]);

  return { events, summary, loading, error };
}
