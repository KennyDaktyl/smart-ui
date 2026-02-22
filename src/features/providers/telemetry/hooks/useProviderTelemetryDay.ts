import { useEffect, useState } from "react";
import { providersApi } from "@/api/providersApi";
import type { DayEnergy } from "@/features/providers/types/userProvider";

type UseProviderTelemetryDayOptions = {
  providerUuid?: string;
  date: string;
  loadErrorMessage: string;
};

type UseProviderTelemetryDayState = {
  day: DayEnergy | null;
  unit: string | null;
  loading: boolean;
  error: string | null;
};

const INITIAL_STATE: UseProviderTelemetryDayState = {
  day: null,
  unit: null,
  loading: false,
  error: null,
};

export function useProviderTelemetryDay({
  providerUuid,
  date,
  loadErrorMessage,
}: UseProviderTelemetryDayOptions): UseProviderTelemetryDayState {
  const [state, setState] = useState<UseProviderTelemetryDayState>(
    INITIAL_STATE
  );

  useEffect(() => {
    if (!providerUuid || !date) {
      setState(INITIAL_STATE);
      return;
    }

    let cancelled = false;

    const loadTelemetry = async () => {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        const res = await providersApi.getProviderEnergy(providerUuid, {
          date,
        });

        if (cancelled) return;

        const dayFromKey = res.data.days?.[date] ?? null;
        const firstDay =
          Object.values(res.data.days ?? {}).sort((a, b) =>
            a.date.localeCompare(b.date)
          )[0] ?? null;

        setState({
          day: dayFromKey ?? firstDay,
          unit: res.data.unit ?? null,
          loading: false,
          error: null,
        });
      } catch {
        if (cancelled) return;
        setState({
          day: null,
          unit: null,
          loading: false,
          error: loadErrorMessage,
        });
      }
    };

    void loadTelemetry();

    return () => {
      cancelled = true;
    };
  }, [date, loadErrorMessage, providerUuid]);

  return state;
}
