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

export type LiveStatus = "pending" | "online" | "offline";

export type LiveState = {
  lastSeen: string | null;
  status: LiveStatus;
};

type SubscriptionEntry = {
  handler: (payload: any) => void;
  timeoutId: number;
};

// ============================================================
// Hook
// ============================================================

export function useMicrocontrollerLive(uuid?: string) {
  const [state, setState] = useState<LiveState>({
    lastSeen: null,
    status: "pending",
  });

  const subRef = useRef<SubscriptionEntry | null>(null);

  // ============================================================
  // Helpers
  // ============================================================

  const clearTimeoutSafe = () => {
    if (subRef.current) {
      clearTimeout(subRef.current.timeoutId);
    }
  };

  const scheduleOffline = () => {
    clearTimeoutSafe();

    const timeoutId = window.setTimeout(() => {
      setState((prev) => ({
        ...prev,
        status: "offline",
      }));
    }, ONLINE_TIMEOUT_MS);

    if (subRef.current) {
      subRef.current.timeoutId = timeoutId;
    }
  };

  // ============================================================
  // Effect
  // ============================================================

  useEffect(() => {
    if (!uuid) {
      clearTimeoutSafe();
      setState({
        lastSeen: null,
        status: "pending",
      });
      return;
    }

    const handler = (payload: any) => {
      const sentAt =
        payload?.sent_at ??
        payload?.data?.sent_at ??
        new Date().toISOString();

      setState({
        lastSeen: sentAt,
        status: "online",
      });

      scheduleOffline();
    };

    wsManager.subscribe(uuid, HEARTBEAT_EVENT, handler);

    subRef.current = {
      handler,
      timeoutId: window.setTimeout(() => {
        setState((prev) => ({
          ...prev,
          status: "offline",
        }));
      }, ONLINE_TIMEOUT_MS),
    };

    return () => {
      clearTimeoutSafe();
      wsManager.unsubscribe(uuid, HEARTBEAT_EVENT, handler);
      subRef.current = null;
    };
  }, [uuid]);

  return state;
}
