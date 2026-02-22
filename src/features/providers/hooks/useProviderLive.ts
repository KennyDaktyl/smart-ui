import { useEffect, useRef, useState } from "react";
import { wsManager } from "@/ws/WebSocketManager";

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
  };
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
};

type InternalProviderState = Omit<ProviderLiveSnapshot, "status">;

export type UseProviderLiveOptions = {
  uuid?: string;
  enabled?: boolean;
  expectedIntervalSec?: number;
  initialPower?: number | null;
  initialUnit?: string | null;
  initialMeasuredAt?: string | null;
};

type ParsedProviderCurrentEnergy = {
  measuredAt: string | null;
  value: number | null;
  unit: string | null;
};

const toFiniteNumber = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const toNullableString = (value: unknown): string | null =>
  typeof value === "string" && value.trim().length > 0 ? value : null;

const parseProviderCurrentEnergy = (
  event: ProviderCurrentEnergyEvent
): ParsedProviderCurrentEnergy => {
  const measuredAt =
    toNullableString(event.data?.measured_at) ??
    toNullableString(event.measured_at) ??
    toNullableString(event.timestamp);

  const value =
    toFiniteNumber(event.data?.value) ??
    toFiniteNumber(event.data?.measured_value) ??
    toFiniteNumber(event.value) ??
    toFiniteNumber(event.measured_value);

  const unit =
    toNullableString(event.data?.unit) ??
    toNullableString(event.data?.measured_unit) ??
    toNullableString(event.unit) ??
    toNullableString(event.measured_unit);

  return {
    measuredAt,
    value,
    unit,
  };
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
