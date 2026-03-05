import { useEffect, useMemo, useRef, useState } from "react";
import { wsManager } from "@/ws/WebSocketManager";

const HEARTBEAT_EVENT = "microcontroller_heartbeat";

// ============================================================
// Types
// ============================================================

export type DeviceLiveState = {
  isOn: boolean;
  mode?: string | null;
  threshold?: number | null;
  seenAt: number;
};

export type DeviceHeartbeatSubscription = {
  id?: number;
  uuid: string;
};

type DeviceLiveMap = Record<number, DeviceLiveState>;

type MicrocontrollerHeartbeatEvent = {
  event_type?: "HEARTBEAT";
  timestamp?: number | string;
  payload?: Record<string, unknown>;
  data?: Record<string, unknown>;
};

// ============================================================
// Hook
// ============================================================

type DeviceHeartbeatItem = {
  device_id?: number;
  id?: number;
  is_on?: boolean;
  isOn?: boolean;
  manual_state?: boolean;
  mode?: string | null;
  threshold?: number | null;
  threshold_value?: number | null;
};

type DeviceEntryContext = {
  subjectUuid: string;
  uuidToDeviceId: Map<string, number>;
};

const parseTimestampMs = (rawTimestamp: unknown): number => {
  if (typeof rawTimestamp === "number") {
    // backend sends unix seconds in some heartbeat payloads
    return rawTimestamp > 1_000_000_000_000
      ? rawTimestamp
      : rawTimestamp * 1000;
  }

  if (typeof rawTimestamp === "string") {
    const parsed = Date.parse(rawTimestamp);
    if (!Number.isNaN(parsed)) return parsed;
  }

  return Date.now();
};

const resolveIsOn = (
  rawIsOn: unknown,
  status: unknown
): boolean | undefined => {
  if (typeof rawIsOn === "boolean") return rawIsOn;
  if (status === "offline") return false;
  return undefined;
};

const toDeviceEntry = (
  device: DeviceHeartbeatItem,
  seenAt: number,
  status?: unknown,
  fallbackDeviceId?: number
): [number, DeviceLiveState] | null => {
  const rawId = device.device_id ?? device.id ?? fallbackDeviceId;
  const deviceId = Number(rawId);
  if (!Number.isFinite(deviceId)) return null;

  const isOn = resolveIsOn(
    device.is_on ?? device.isOn ?? device.manual_state,
    status
  );
  if (typeof isOn !== "boolean") return null;

  return [
    deviceId,
    {
      isOn,
      mode: device.mode ?? null,
      threshold: device.threshold ?? device.threshold_value ?? null,
      seenAt,
    },
  ];
};

const extractDeviceEntries = (
  event: MicrocontrollerHeartbeatEvent,
  context: DeviceEntryContext
): Array<[number, DeviceLiveState]> => {
  const rawPayload =
    (event.payload as Record<string, unknown> | undefined) ??
    (event.data as Record<string, unknown> | undefined) ??
    (event as Record<string, unknown>);

  const status = rawPayload.status;
  const seenAt = parseTimestampMs(rawPayload.timestamp ?? event.timestamp);
  const payloadUuid =
    typeof rawPayload.uuid === "string" ? rawPayload.uuid : undefined;
  const fallbackDeviceId =
    (payloadUuid ? context.uuidToDeviceId.get(payloadUuid) : undefined) ??
    context.uuidToDeviceId.get(context.subjectUuid);

  const rawDevices = rawPayload.devices;
  if (Array.isArray(rawDevices)) {
    const entries: Array<[number, DeviceLiveState]> = [];

    rawDevices.forEach((item) => {
      const parsed = toDeviceEntry(
        item as DeviceHeartbeatItem,
        seenAt,
        status,
        fallbackDeviceId
      );
      if (parsed) entries.push(parsed);
    });

    return entries;
  }

  const payloadDevice =
    rawPayload.device &&
    typeof rawPayload.device === "object" &&
    !Array.isArray(rawPayload.device)
      ? (rawPayload.device as DeviceHeartbeatItem)
      : (rawPayload as DeviceHeartbeatItem);

  const singleEntry = toDeviceEntry(
    payloadDevice,
    seenAt,
    status,
    fallbackDeviceId
  );
  return singleEntry ? [singleEntry] : [];
};

const normalizeSubscriptions = (
  subscriptions: DeviceHeartbeatSubscription[]
): DeviceHeartbeatSubscription[] => {
  const byUuid = new Map<string, number | undefined>();

  subscriptions.forEach((subscription) => {
    const normalizedUuid = subscription.uuid?.trim();
    if (!normalizedUuid) return;

    const parsedId = Number(subscription.id);
    if (Number.isFinite(parsedId)) {
      byUuid.set(normalizedUuid, parsedId);
      return;
    }

    if (!byUuid.has(normalizedUuid)) {
      byUuid.set(normalizedUuid, undefined);
    }
  });

  return Array.from(byUuid.entries())
    .sort(([leftUuid], [rightUuid]) => leftUuid.localeCompare(rightUuid))
    .map(([uuid, id]) => ({ uuid, id }));
};

const hasFiniteSubscriptionId = (
  subscription: DeviceHeartbeatSubscription
): boolean => Number.isFinite(Number(subscription.id));

const collectHeartbeatSubjectUuids = (
  microcontrollerUuid: string | undefined,
  subscriptions: DeviceHeartbeatSubscription[]
): Set<string> => {
  const subjects = new Set<string>();

  const normalizedMicrocontrollerUuid = microcontrollerUuid?.trim();
  if (normalizedMicrocontrollerUuid) {
    subjects.add(normalizedMicrocontrollerUuid);
  }

  subscriptions.forEach((subscription) => {
    if (hasFiniteSubscriptionId(subscription)) {
      return;
    }

    subjects.add(subscription.uuid);
  });

  return subjects;
};

export function useDeviceLiveState(
  microcontrollerUuid?: string,
  deviceSubscriptions: DeviceHeartbeatSubscription[] = []
) {
  const [state, setState] = useState<DeviceLiveMap>({});
  const subscriptionsRef = useRef<
    Map<string, (event: MicrocontrollerHeartbeatEvent) => void>
  >(new Map());
  const normalizedSubscriptions = useMemo(
    () => normalizeSubscriptions(deviceSubscriptions),
    [deviceSubscriptions]
  );
  const uuidToDeviceId = useMemo(
    () =>
      new Map<string, number>(
        normalizedSubscriptions
          .filter((subscription) => Number.isFinite(subscription.id))
          .map((subscription) => [
            subscription.uuid,
            Number(subscription.id),
          ])
      ),
    [normalizedSubscriptions]
  );

  useEffect(() => {
    const nextSubscriptionUuids = collectHeartbeatSubjectUuids(
      microcontrollerUuid,
      normalizedSubscriptions
    );

    subscriptionsRef.current.forEach((handler, uuid) => {
      if (!nextSubscriptionUuids.has(uuid)) {
        wsManager.unsubscribe(uuid, HEARTBEAT_EVENT, handler);
        subscriptionsRef.current.delete(uuid);
      }
    });

    nextSubscriptionUuids.forEach((uuid) => {
      if (subscriptionsRef.current.has(uuid)) return;

      const handler = (event: MicrocontrollerHeartbeatEvent) => {
        const entries = extractDeviceEntries(event, {
          subjectUuid: uuid,
          uuidToDeviceId,
        });
        if (entries.length === 0) return;

        setState((prev) => {
          const next = { ...prev };
          entries.forEach(([deviceId, deviceState]) => {
            next[deviceId] = deviceState;
          });
          return next;
        });
      };

      const cachedHeartbeat = wsManager.getLastMessage<MicrocontrollerHeartbeatEvent>(
        uuid,
        HEARTBEAT_EVENT
      );
      if (cachedHeartbeat) {
        handler(cachedHeartbeat);
      }

      wsManager.subscribe(uuid, HEARTBEAT_EVENT, handler);
      subscriptionsRef.current.set(uuid, handler);
    });
  }, [microcontrollerUuid, normalizedSubscriptions, uuidToDeviceId]);

  useEffect(() => {
    return () => {
      subscriptionsRef.current.forEach((handler, uuid) => {
        wsManager.unsubscribe(uuid, HEARTBEAT_EVENT, handler);
      });
      subscriptionsRef.current.clear();
    };
  }, []);

  return state;
}
