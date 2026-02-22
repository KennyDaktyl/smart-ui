import { useEffect, useRef, useState } from "react";

import { wsManager } from "@/ws/WebSocketManager";
import type { DeviceEvent } from "@/features/devices/types/deviceEvents";

const DEVICE_EVENT_NAME = "device_event";
const IS_DEV = import.meta.env.DEV;

export type DeviceEventLiveSnapshot = {
  loading: boolean;
  subscribed: boolean;
  lastEvent: DeviceEvent | null;
};

export type UseDeviceEventLiveOptions = {
  deviceUuid?: string;
  enabled?: boolean;
  onEvent?: (event: DeviceEvent) => void;
};

const INITIAL_SNAPSHOT: DeviceEventLiveSnapshot = {
  loading: false,
  subscribed: false,
  lastEvent: null,
};

const logLive = (...args: unknown[]) => {
  if (!IS_DEV) return;
  // eslint-disable-next-line no-console
  console.info("[DeviceEventLive]", ...args);
};

const asRecord = (value: unknown): Record<string, unknown> | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
};

const parseMaybeJson = (value: unknown): unknown => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const toNullableString = (value: unknown): string | null => {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const toNullableNumber = (value: unknown): number | null => {
  if (value == null) return null;

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
};

const toBoolean = (value: unknown): boolean | null => {
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    if (value === "true") return true;
    if (value === "false") return false;
  }
  if (typeof value === "number") {
    if (value === 1) return true;
    if (value === 0) return false;
  }

  return null;
};

const buildSyntheticEventId = (
  deviceId: number,
  createdAt: string,
  eventName: string,
  pinState: boolean
): number => {
  const seed = `${deviceId}:${createdAt}:${eventName}:${pinState ? 1 : 0}`;
  let hash = 0;

  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash << 5) - hash + seed.charCodeAt(index);
    hash |= 0;
  }

  if (hash === 0) return -1;
  return hash > 0 ? -hash : hash;
};

const normalizeDeviceEvent = (raw: unknown): DeviceEvent | null => {
  const root = asRecord(parseMaybeJson(raw));
  if (!root) return null;

  const candidates: Record<string, unknown>[] = [root];

  const payloadCandidate = asRecord(root.payload);
  if (payloadCandidate) candidates.push(payloadCandidate);

  const dataCandidate = asRecord(root.data);
  if (dataCandidate) candidates.push(dataCandidate);

  for (const candidate of candidates) {
    const id = toNullableNumber(candidate.id);
    const deviceId = toNullableNumber(candidate.device_id);
    const eventType = toNullableString(candidate.event_type);
    const eventName = toNullableString(candidate.event_name);
    const createdAt = toNullableString(candidate.created_at);
    const pinState = toBoolean(candidate.pin_state ?? candidate.is_on);

    if (
      deviceId == null ||
      eventType == null ||
      eventName == null ||
      createdAt == null ||
      pinState == null
    ) {
      continue;
    }

    return {
      id: id ?? buildSyntheticEventId(deviceId, createdAt, eventName, pinState),
      device_id: deviceId,
      event_type: eventType,
      event_name: eventName,
      device_state: toNullableString(candidate.device_state),
      pin_state: pinState,
      measured_value: toNullableNumber(candidate.measured_value),
      measured_unit: toNullableString(candidate.measured_unit),
      trigger_reason: toNullableString(candidate.trigger_reason),
      source: toNullableString(candidate.source),
      created_at: createdAt,
    };
  }

  return null;
};

export function useDeviceEventLive({
  deviceUuid,
  enabled = true,
  onEvent,
}: UseDeviceEventLiveOptions): DeviceEventLiveSnapshot {
  const [snapshot, setSnapshot] = useState<DeviceEventLiveSnapshot>(
    INITIAL_SNAPSHOT
  );

  const onEventRef = useRef<UseDeviceEventLiveOptions["onEvent"]>(onEvent);

  useEffect(() => {
    onEventRef.current = onEvent;
  }, [onEvent]);

  useEffect(() => {
    if (!enabled || !deviceUuid) {
      setSnapshot(INITIAL_SNAPSHOT);
      return;
    }

    setSnapshot({
      loading: true,
      subscribed: false,
      lastEvent: null,
    });

    const consume = (raw: unknown) => {
      logLive("incoming payload", { deviceUuid, raw });
      const parsedEvent = normalizeDeviceEvent(raw);
      if (!parsedEvent) {
        logLive("payload ignored (parse failed)", { deviceUuid, raw });
        return;
      }

      logLive("parsed event", { deviceUuid, event: parsedEvent });

      setSnapshot({
        loading: false,
        subscribed: true,
        lastEvent: parsedEvent,
      });

      onEventRef.current?.(parsedEvent);
    };

    const cached = wsManager.getLastMessage<unknown>(
      deviceUuid,
      DEVICE_EVENT_NAME
    );

    if (cached) {
      logLive("consuming cached payload", {
        deviceUuid,
        eventName: DEVICE_EVENT_NAME,
      });
      consume(cached);
    } else {
      setSnapshot({
        loading: false,
        subscribed: true,
        lastEvent: null,
      });
    }

    const handler = (event: unknown) => {
      consume(event);
    };

    logLive("subscribing", { deviceUuid, eventName: DEVICE_EVENT_NAME });
    wsManager.subscribe(deviceUuid, DEVICE_EVENT_NAME, handler);

    return () => {
      logLive("unsubscribing", { deviceUuid, eventName: DEVICE_EVENT_NAME });
      wsManager.unsubscribe(deviceUuid, DEVICE_EVENT_NAME, handler);
    };
  }, [deviceUuid, enabled]);

  return snapshot;
}
