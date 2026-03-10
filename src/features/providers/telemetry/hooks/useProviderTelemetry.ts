import { useEffect, useState } from "react";

import { providersApi } from "@/api/providersApi";
import type { ProviderTelemetryResponse } from "@/features/providers/types/userProvider";

type UseProviderTelemetryOptions = {
  providerUuid?: string;
  date: string;
  loadErrorMessage: string;
};

type UseProviderTelemetryState = {
  telemetry: ProviderTelemetryResponse | null;
  loading: boolean;
  error: string | null;
};

const INITIAL_STATE: UseProviderTelemetryState = {
  telemetry: null,
  loading: false,
  error: null,
};

export function useProviderTelemetry({
  providerUuid,
  date,
  loadErrorMessage,
}: UseProviderTelemetryOptions): UseProviderTelemetryState {
  const [state, setState] =
    useState<UseProviderTelemetryState>(INITIAL_STATE);

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
        const res = await providersApi.getProviderTelemetry(providerUuid, {
          date,
        });
        if (cancelled) return;
        setState({
          telemetry: res.data,
          loading: false,
          error: null,
        });
      } catch {
        if (cancelled) return;
        setState({
          telemetry: null,
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
