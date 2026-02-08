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

// ============================================================
// Hook
// ============================================================

export function useMicrocontrollerLive(uuid?: string) {
  const [state, setState] = useState<LiveState>({
    lastSeen: null,
    status: "pending",
  });

  const offlineTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!uuid) return;

    const handler = (msg: any) => {
      const payload = msg?.data?.payload;
      if (!payload) return;

      const lastSeen = new Date(payload.timestamp * 1000).toISOString();

      setState({
        lastSeen,
        status: payload.status === "online" ? "online" : "offline",
      });

      if (offlineTimeoutRef.current) {
        clearTimeout(offlineTimeoutRef.current);
      }

      offlineTimeoutRef.current = window.setTimeout(() => {
        setState((prev) =>
          prev.status === "offline"
            ? prev
            : { ...prev, status: "offline" }
        );
      }, ONLINE_TIMEOUT_MS);
    };

    wsManager.subscribe(uuid, HEARTBEAT_EVENT, handler);

    return () => {
      if (offlineTimeoutRef.current) {
        clearTimeout(offlineTimeoutRef.current);
        offlineTimeoutRef.current = null;
      }
      wsManager.unsubscribe(uuid, HEARTBEAT_EVENT, handler);
    };
  }, [uuid]);

  return state;
}
