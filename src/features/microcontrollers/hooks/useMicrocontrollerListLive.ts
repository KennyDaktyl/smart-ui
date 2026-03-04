import { useEffect, useRef, useState } from "react";
import { wsManager } from "@/ws/WebSocketManager";
import { Device } from "@/features/devices/types/devicesType";
import {
  DEFAULT_HEARTBEAT_TIMEOUT_MS,
  resolveHeartbeatTimeoutMs,
  resolveHeartbeatTimestampMs,
} from "@/features/microcontrollers/hooks/heartbeatTiming";

const HEARTBEAT_EVENT = "microcontroller_heartbeat";

export type MicrocontrollerLiveState = {
  isOnline: boolean;
  lastSeen: string | null;
  loading: boolean;
};

type StateMap = Record<string, MicrocontrollerLiveState>;

type Entry = {
  handler: (payload: any) => void;
  timeoutId: number;
};

export function useMicrocontrollersLive(uuids: string[]): StateMap {
  const [state, setState] = useState<StateMap>({});
  const subsRef = useRef<Map<string, Entry>>(new Map());

  const clearTimer = (uuid: string) => {
    const entry = subsRef.current.get(uuid);
    if (entry) clearTimeout(entry.timeoutId);
  };

  const scheduleOffline = (
    uuid: string,
    timeoutMs = DEFAULT_HEARTBEAT_TIMEOUT_MS
  ) => {
    clearTimer(uuid);

    const timeoutId = window.setTimeout(() => {
      setState((prev) => ({
        ...prev,
        [uuid]: {
          ...prev[uuid],
          isOnline: false,
          loading: false,
        },
      }));
    }, timeoutMs);

    const entry = subsRef.current.get(uuid);
    if (entry) entry.timeoutId = timeoutId;
  };

  useEffect(() => {
    const next = new Set(uuids);

    subsRef.current.forEach((entry, uuid) => {
      if (!next.has(uuid)) {
        clearTimeout(entry.timeoutId);
        wsManager.unsubscribe(uuid, HEARTBEAT_EVENT, entry.handler);
        subsRef.current.delete(uuid);

        setState((prev) => {
          const copy = { ...prev };
          delete copy[uuid];
          return copy;
        });
      }
    });

    uuids.forEach((uuid) => {
      if (subsRef.current.has(uuid)) return;

      const handler = (payload: any) => {
        const seenAtMs = resolveHeartbeatTimestampMs(payload);
        const timeoutMs = resolveHeartbeatTimeoutMs(
          payload,
          DEFAULT_HEARTBEAT_TIMEOUT_MS
        );

        setState((prev) => ({
          ...prev,
          [uuid]: {
            isOnline: true,
            lastSeen: new Date(seenAtMs).toISOString(),
            loading: false,
          },
        }));

        scheduleOffline(uuid, timeoutMs);
      };

      wsManager.subscribe(uuid, HEARTBEAT_EVENT, handler);

      subsRef.current.set(uuid, {
        handler,
        timeoutId: window.setTimeout(() => {
          setState((prev) => ({
            ...prev,
            [uuid]: {
              isOnline: false,
              lastSeen: null,
              loading: false,
            },
          }));
        }, DEFAULT_HEARTBEAT_TIMEOUT_MS),
      });

      setState((prev) => ({
        ...prev,
        [uuid]: {
          isOnline: false,
          lastSeen: null,
          loading: true,
        },
      }));
    });
  }, [uuids.join(",")]);

  useEffect(() => {
    return () => {
      subsRef.current.forEach((entry, uuid) => {
        clearTimeout(entry.timeoutId);
        wsManager.unsubscribe(uuid, HEARTBEAT_EVENT, entry.handler);
      });
      subsRef.current.clear();
    };
  }, []);

  return state;
}
