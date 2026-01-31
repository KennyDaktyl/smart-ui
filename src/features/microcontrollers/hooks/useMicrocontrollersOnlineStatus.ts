import { useEffect, useRef, useState } from "react";
import { wsManager } from "@/ws/WebSocketManager";

// ============================================================
// Config
// ============================================================

const HEARTBEAT_EVENT = "microcontroller_heartbeat";
const ONLINE_TIMEOUT_MS = 15_000;

// ============================================================
// Types
// ============================================================

export type MicrocontrollerOnlineState = {
  isOnline: boolean;
  lastSeen: string | null;
};

type StateMap = Record<string, MicrocontrollerOnlineState>;

type SubscriptionEntry = {
  handler: (payload: any) => void;
  timeoutId: number;
};

// ============================================================
// Hook
// ============================================================

export function useMicrocontrollersOnlineStatus(uuids: string[]) {
  const [state, setState] = useState<StateMap>({});
  const subsRef = useRef<Map<string, SubscriptionEntry>>(new Map());

  // ============================================================
  // Helpers
  // ============================================================

  const clearTimeoutFor = (uuid: string) => {
    const entry = subsRef.current.get(uuid);
    if (!entry) return;
    clearTimeout(entry.timeoutId);
  };

  const scheduleOffline = (uuid: string) => {
    clearTimeoutFor(uuid);

    const timeoutId = window.setTimeout(() => {
      setState((prev) => ({
        ...prev,
        [uuid]: {
          ...prev[uuid],
          isOnline: false,
        },
      }));
    }, ONLINE_TIMEOUT_MS);

    const entry = subsRef.current.get(uuid);
    if (entry) {
      entry.timeoutId = timeoutId;
    }
  };

  // ============================================================
  // WS handler factory
  // ============================================================

  const createHandler =
    (uuid: string) =>
    (payload: any) => {
      const sentAt =
        payload?.sent_at ??
        payload?.data?.sent_at ??
        new Date().toISOString();

      setState((prev) => ({
        ...prev,
        [uuid]: {
          isOnline: true,
          lastSeen: sentAt,
        },
      }));

      scheduleOffline(uuid);
    };

  // ============================================================
  // DIFF EFFECT (subscribe / unsubscribe)
  // ============================================================

  useEffect(() => {
    const next = new Set(uuids);

    // 1️⃣ UNSUBSCRIBE REMOVED
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

    // 2️⃣ SUBSCRIBE NEW
    uuids.forEach((uuid) => {
      if (subsRef.current.has(uuid)) return;

      const handler = createHandler(uuid);

      wsManager.subscribe(uuid, HEARTBEAT_EVENT, handler);

      const timeoutId = window.setTimeout(() => {
        setState((prev) => ({
          ...prev,
          [uuid]: {
            ...prev[uuid],
            isOnline: false,
          },
        }));
      }, ONLINE_TIMEOUT_MS);

      subsRef.current.set(uuid, {
        handler,
        timeoutId,
      });

      setState((prev) => ({
        ...prev,
        [uuid]: {
          isOnline: false,
          lastSeen: null,
        },
      }));
    });
  }, [uuids]);

  // ============================================================
  // Cleanup ONLY on unmount
  // ============================================================

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
