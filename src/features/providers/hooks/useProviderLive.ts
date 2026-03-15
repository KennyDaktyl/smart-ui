import { useEffect, useRef, useState } from "react";
import { wsManager } from "@/ws/WebSocketManager";
import {
  createInitialProviderMetrics,
  parseProviderCurrentEnergy,
  type ProviderLiveMetricMap,
} from "@/features/providers/utils/providerLiveMetrics";

const PROVIDER_EVENT = "provider_current_energy";
const BUFFER_SEC = 5;
const TICK_MS = 1000;
const DEFAULT_EXPECTED_INTERVAL_SEC = 30;

type ProviderCurrentEnergyEvent = {
  event_type?: "CURRENT_ENERGY";
  timestamp?: string;
  measured_at?: string;
  value?: number;
  unit?: string | null;
  measured_value?: number;
  measured_unit?: string | null;
  data?: {
    value?: number;
    unit?: string | null;
    measured_at?: string;
    measured_value?: number;
    measured_unit?: string | null;
    battery_soc?: { value?: number; unit?: string | null } | null;
    grid_power?: { value?: number; unit?: string | null } | null;
    extra_metrics?: Array<{
      key?: string;
      metric_key?: string;
      value?: number;
      unit?: string | null;
    }> | null;
  };
  battery_soc?: { value?: number; unit?: string | null } | null;
  grid_power?: { value?: number; unit?: string | null } | null;
  extra_metrics?: Array<{
    key?: string;
    metric_key?: string;
    value?: number;
    unit?: string | null;
  }> | null;
};

export type ProviderLiveStatus = "pending" | "online" | "stale" | "offline";

export type ProviderLiveSnapshot = {
  status: ProviderLiveStatus;
  loading: boolean;
  hasWs: boolean;
  isStale: boolean;
  measuredAt: string | null;
  nextExpectedAt: string | null;
  countdownSec: number | null;
  power: number | null;
  unit: string | null;
  metrics: ProviderLiveMetricMap;
};

type InternalProviderState = Omit<ProviderLiveSnapshot, "status">;

export type UseProviderLiveOptions = {
  uuid?: string;
  enabled?: boolean;
  expectedIntervalSec?: number;
  initialPower?: number | null;
  initialUnit?: string | null;
  initialMeasuredAt?: string | null;
  initialMetrics?: Array<{
    metric_key?: string | null;
    value?: number | null;
    unit?: string | null;
  }> | null;
};

const resolveBaseTimestampMs = (measuredAt: string | null) => {
  if (!measuredAt) return Date.now();
  const parsed = Date.parse(measuredAt);
  return Number.isFinite(parsed) ? parsed : Date.now();
};

const resolveStatus = (
  state: InternalProviderState,
  connected: boolean
): ProviderLiveStatus => {
  if (!connected) return "offline";
  if (state.isStale) return "stale";
  if (state.hasWs) return "online";
  return "pending";
};

const toSnapshot = (
  state: InternalProviderState,
  connected: boolean
): ProviderLiveSnapshot => ({
  ...state,
  status: resolveStatus(state, connected),
});

export function useProviderLive({
  uuid,
  enabled = true,
  expectedIntervalSec = DEFAULT_EXPECTED_INTERVAL_SEC,
  initialPower = null,
  initialUnit = null,
  initialMeasuredAt = null,
  initialMetrics = null,
}: UseProviderLiveOptions): ProviderLiveSnapshot {
  const [state, setState] = useState<InternalProviderState>({
    loading: Boolean(uuid) && enabled && !initialMeasuredAt,
    hasWs: false,
    isStale: false,
    measuredAt: initialMeasuredAt,
    nextExpectedAt: null,
    countdownSec: null,
    power: initialPower,
    unit: initialUnit,
    metrics: createInitialProviderMetrics(initialPower, initialUnit, initialMetrics),
  });

  const timerRef = useRef<number | null>(null);

  const clearTimer = () => {
    if (timerRef.current != null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const normalizedExpectedIntervalSec =
    Number.isFinite(expectedIntervalSec) && expectedIntervalSec >= 0
      ? expectedIntervalSec
      : DEFAULT_EXPECTED_INTERVAL_SEC;

  const startCountdown = (baseMs = Date.now()) => {
    clearTimer();

    const nextExpectedAtMs =
      baseMs + (normalizedExpectedIntervalSec + BUFFER_SEC) * 1000;

    const tick = () => {
      const remainingMs = nextExpectedAtMs - Date.now();
      const countdownSec = Math.max(0, Math.ceil(remainingMs / 1000));

      setState((prev) => ({
        ...prev,
        countdownSec,
        nextExpectedAt: new Date(nextExpectedAtMs).toISOString(),
        isStale: remainingMs <= 0,
      }));
    };

    tick();
    timerRef.current = window.setInterval(tick, TICK_MS);
  };

  useEffect(() => {
    clearTimer();

    const connected = Boolean(uuid) && enabled;
    const bootstrapState: InternalProviderState = {
      loading: connected && !initialMeasuredAt,
      hasWs: false,
      isStale: false,
      measuredAt: initialMeasuredAt,
      nextExpectedAt: null,
      countdownSec: null,
      power: initialPower,
      unit: initialUnit,
      metrics: createInitialProviderMetrics(initialPower, initialUnit, initialMetrics),
    };

    setState(bootstrapState);

    if (!connected || !uuid) {
      return () => {
        clearTimer();
      };
    }

    if (initialMeasuredAt) {
      // Countdown predicts next WS push from now. Backend timestamps can lag.
      startCountdown();
    }

    const handler = (event: ProviderCurrentEnergyEvent) => {
      if (event?.event_type && event.event_type !== "CURRENT_ENERGY") return;

      const parsed = parseProviderCurrentEnergy(event);

      setState((prev) => ({
        ...prev,
        loading: false,
        hasWs: true,
        isStale: false,
        measuredAt: parsed.measuredAt ?? prev.measuredAt,
        nextExpectedAt: null,
        countdownSec: null,
        power: parsed.value ?? prev.power,
        unit: parsed.unit ?? prev.unit,
        metrics:
          Object.keys(parsed.metrics).length > 0
            ? parsed.metrics
            : prev.metrics,
      }));

      startCountdown(resolveBaseTimestampMs(parsed.measuredAt));
    };

    wsManager.subscribe(uuid, PROVIDER_EVENT, handler);

    const cachedEvent =
      wsManager.getLastMessage<ProviderCurrentEnergyEvent>(uuid, PROVIDER_EVENT);

    if (cachedEvent) {
      handler(cachedEvent);
    }

    return () => {
      clearTimer();
      wsManager.unsubscribe(uuid, PROVIDER_EVENT, handler);
    };
  }, [
    enabled,
    expectedIntervalSec,
    initialMeasuredAt,
    initialMetrics,
    initialPower,
    initialUnit,
    uuid,
  ]);

  useEffect(
    () => () => {
      clearTimer();
    },
    []
  );

  return toSnapshot(state, Boolean(uuid) && enabled);
}
