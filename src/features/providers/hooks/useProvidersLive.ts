import { useEffect, useRef, useState } from "react";
import { wsManager } from "@/ws/WebSocketManager";
import { ProviderResponse } from "@/features/providers/types/userProvider";

// ============================================================
// Config
// ============================================================

const PROVIDER_EVENT = "provider_current_energy";
const BUFFER_SEC = 5;
const TICK_MS = 1000;

// ============================================================
// Types
// ============================================================

type ProviderCurrentEnergyEvent = {
  event_type: "CURRENT_ENERGY";
  entity_id: string;
  timestamp: string;
  data: {
    value: number;
    unit: string;
    measured_at: string;
  };
};

export type ProviderLiveState = {
  loading: boolean;
  hasWs: boolean;
  isStale: boolean;

  timestamp: string | null;
  nextExpectedAt: string | null;
  countdownSec: number | null;

  power: number | null;
  unit: string | null;
};

type StateMap = Record<string, ProviderLiveState>;

type SubscriptionEntry = {
  handler: (event: ProviderCurrentEnergyEvent) => void;
  timerId: number;
};

// ============================================================
// Hook
// ============================================================

export function useProvidersLive(
  providers: ProviderResponse[]
): StateMap {
  const [state, setState] = useState<StateMap>({});
  const subsRef = useRef<Map<string, SubscriptionEntry>>(new Map());

  const enabledProviders = providers.filter((p) => p.enabled);

  // ============================================================
  // Helpers
  // ============================================================

  const clearTimer = (uuid: string) => {
    const entry = subsRef.current.get(uuid);
    if (entry) clearInterval(entry.timerId);
  };

  const startCountdown = (
    provider: ProviderResponse,
    measuredAtIso: string
  ) => {
    clearTimer(provider.uuid);

    const measuredAt = new Date(measuredAtIso).getTime();
    const intervalMs =
      (provider.default_expected_interval_sec + BUFFER_SEC) * 1000;

    const nextExpectedAt = measuredAt + intervalMs;

    const tick = () => {
      const remainingMs = nextExpectedAt - Date.now();
      const remainingSec = Math.max(
        0,
        Math.ceil(remainingMs / 1000)
      );

      setState((prev) => ({
        ...prev,
        [provider.uuid]: {
          ...prev[provider.uuid],
          countdownSec: remainingSec,
          isStale: remainingMs <= 0,
        },
      }));
    };

    tick();

    const timerId = window.setInterval(tick, TICK_MS);

    subsRef.current.set(provider.uuid, {
      handler: subsRef.current.get(provider.uuid)!.handler,
      timerId,
    });

    setState((prev) => ({
      ...prev,
      [provider.uuid]: {
        ...prev[provider.uuid],
        nextExpectedAt: new Date(nextExpectedAt).toISOString(),
      },
    }));
  };

  // ============================================================
  // Effect
  // ============================================================

  useEffect(() => {
    const next = new Set(enabledProviders.map((p) => p.uuid));

    // ---- unsubscribe removed
    subsRef.current.forEach((entry, uuid) => {
      if (!next.has(uuid)) {
        clearInterval(entry.timerId);
        wsManager.unsubscribe(uuid, PROVIDER_EVENT, entry.handler);
        subsRef.current.delete(uuid);
      }
    });

    // ---- subscribe new
    enabledProviders.forEach((provider) => {
      if (subsRef.current.has(provider.uuid)) return;

      const handler = (event: ProviderCurrentEnergyEvent) => {
        if (event.event_type !== "CURRENT_ENERGY") return;

        const measuredAt = event.data.measured_at;

        setState((prev) => ({
          ...prev,
          [provider.uuid]: {
            loading: false,
            hasWs: true,
            isStale: false,
            timestamp: measuredAt,
            nextExpectedAt: null,
            countdownSec: null,
            power: event.data.value,
            unit: event.data.unit ?? provider.unit ?? null,
          },
        }));

        startCountdown(provider, measuredAt);
      };

      wsManager.subscribe(provider.uuid, PROVIDER_EVENT, handler);

      subsRef.current.set(provider.uuid, {
        handler,
        timerId: 0,
      });

      // ---- bootstrap from last known value
      const lastValue = provider.last_value;

      if (lastValue) {
        setState((prev) => ({
          ...prev,
          [provider.uuid]: {
            loading: true,
            hasWs: false,
            isStale: false,
            timestamp: lastValue.measured_at,
            power: lastValue.measured_value,
            unit: lastValue.measured_unit ?? provider.unit ?? null,
            countdownSec: null,
            nextExpectedAt: null,
          },
        }));

        startCountdown(provider, lastValue.measured_at);
      }
    });
  }, [enabledProviders.map((p) => p.uuid).join(",")]);

  // ============================================================
  // Cleanup
  // ============================================================

  useEffect(() => {
    return () => {
      subsRef.current.forEach((entry, uuid) => {
        clearInterval(entry.timerId);
        wsManager.unsubscribe(uuid, PROVIDER_EVENT, entry.handler);
      });
      subsRef.current.clear();
    };
  }, []);

  return state;
}
