// src/features/microcontrollers/hooks/useMicrocontrollersOnlineStatus.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { wsManager } from "@/ws/WebSocketManager";
import { HeartbeatPayload } from "@/shared/types/heartbeat";

type OnlineState = {
  lastSeen: number;
  online: boolean;
};

type OnlineStateMap = Record<string, OnlineState>;

const ONLINE_TIMEOUT_MS = 15_000;
const CHECK_INTERVAL_MS = 5_000;

const isDev = process.env.NODE_ENV === "development";

export function useMicrocontrollersOnlineStatus(uuids: string[]) {
  const [state, setState] = useState<OnlineStateMap>({});
  const subscribedRef = useRef<string[]>([]);

  const handleHeartbeat = useCallback((hb: HeartbeatPayload) => {
    setState((prev) => ({
      ...prev,
      [hb.uuid]: {
        lastSeen: Date.now(),
        online: true,
      },
    }));
  }, []);

  useEffect(() => {
    const prev = subscribedRef.current;
    const prevSet = new Set(prev);
    const nextSet = new Set(uuids);

    const added = uuids.filter((id) => !prevSet.has(id));
    const removed = prev.filter((id) => !nextSet.has(id));

    added.forEach((id) => {
      wsManager.subscribeRaspberry(id, handleHeartbeat);

      if (isDev) {
        console.info(
          `[MC ONLINE] Subscribed to microcontroller`,
          id
        );
      }
    });

    removed.forEach((id) => {
      wsManager.unsubscribeRaspberry(id, handleHeartbeat);

      if (isDev) {
        console.info(
          `[MC ONLINE] Unsubscribed from microcontroller`,
          id
        );
      }

      setState((prev) => {
        const copy = { ...prev };
        delete copy[id];
        return copy;
      });
    });

    subscribedRef.current = uuids;

    if (isDev) {
      console.info(
        `[MC ONLINE] Active subscriptions:`,
        uuids.length
      );
    }
  }, [uuids, handleHeartbeat]);

  /**
   * Offline detection
   */
  useEffect(() => {
    const interval = setInterval(() => {
      setState((prev) => {
        const now = Date.now();
        const next: OnlineStateMap = {};

        Object.entries(prev).forEach(([uuid, value]) => {
          next[uuid] = {
            ...value,
            online: now - value.lastSeen < ONLINE_TIMEOUT_MS,
          };
        });

        return next;
      });
    }, CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, []);

  /**
   * Cleanup on unmount (leaving page)
   */
  useEffect(() => {
    return () => {
      if (isDev && subscribedRef.current.length > 0) {
        console.info(
          `[MC ONLINE] Unsubscribing from all microcontrollers`,
          subscribedRef.current
        );
      }

      subscribedRef.current.forEach((id) => {
        wsManager.unsubscribeRaspberry(id, handleHeartbeat);
      });

      subscribedRef.current = [];
    };
  }, [handleHeartbeat]);

  return state;
}
