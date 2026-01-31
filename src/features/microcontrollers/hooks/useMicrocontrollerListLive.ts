import { useEffect, useRef, useState } from "react";
import { wsManager } from "@/ws/WebSocketManager";
import { Device } from "@/features/devices/types/devicesType";

const HEARTBEAT_EVENT = "microcontroller_heartbeat";
const OFFLINE_TIMEOUT_MS = 15_000;

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

  const scheduleOffline = (uuid: string) => {
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
    }, OFFLINE_TIMEOUT_MS);

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
        const sentAt =
          payload?.sent_at ??
          payload?.data?.sent_at ??
          new Date().toISOString();

        setState((prev) => ({
          ...prev,
          [uuid]: {
            isOnline: true,
            lastSeen: sentAt,
            loading: false,
          },
        }));

        scheduleOffline(uuid);
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
        }, OFFLINE_TIMEOUT_MS),
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
