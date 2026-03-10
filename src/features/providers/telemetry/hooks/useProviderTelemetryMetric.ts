import { useEffect, useState } from "react";

import { providersApi } from "@/api/providersApi";
import type { ProviderMetricSeries } from "@/features/providers/types/userProvider";

type UseProviderTelemetryMetricOptions = {
  providerUuid?: string;
  metricKey?: string;
  date: string;
  enabled?: boolean;
  loadErrorMessage: string;
};

type UseProviderTelemetryMetricState = {
  series: ProviderMetricSeries | null;
  loading: boolean;
  error: string | null;
};

const INITIAL_STATE: UseProviderTelemetryMetricState = {
  series: null,
  loading: false,
  error: null,
};

export function useProviderTelemetryMetric({
  providerUuid,
  metricKey,
  date,
  enabled = true,
  loadErrorMessage,
}: UseProviderTelemetryMetricOptions): UseProviderTelemetryMetricState {
  const [state, setState] =
    useState<UseProviderTelemetryMetricState>(INITIAL_STATE);

  useEffect(() => {
    if (!enabled || !providerUuid || !metricKey || !date) {
      setState(INITIAL_STATE);
      return;
    }

    let cancelled = false;

    const loadMetric = async () => {
      setState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        const res = await providersApi.getProviderMetric(providerUuid, metricKey, {
          date,
        });
        if (cancelled) return;
        setState({
          series: res.data,
          loading: false,
          error: null,
        });
      } catch {
        if (cancelled) return;
        setState({
          series: null,
          loading: false,
          error: loadErrorMessage,
        });
      }
    };

    void loadMetric();

    return () => {
      cancelled = true;
    };
  }, [date, enabled, loadErrorMessage, metricKey, providerUuid]);

  return state;
}
