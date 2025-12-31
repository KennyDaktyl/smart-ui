import { useCallback, useEffect, useRef, useState } from "react";
import { wsManager } from "@/ws/WebSocketManager";
import { HeartbeatPayload } from "@/shared/types/heartbeat";

type LiveStatus = "pending" | "online" | "offline";

type LiveState = {
  lastSeen: number | null;
  status: LiveStatus;
};

const ONLINE_TIMEOUT_MS = 15_000;
const CHECK_INTERVAL_MS = 5_000;
const isDev = process.env.NODE_ENV === "development";

export function useMicrocontrollerLive(uuid?: string) {
  const [state, setState] = useState<LiveState>({
    lastSeen: null,
    status: "pending",
  });

  const lastSeenRef = useRef<number | null>(null);

  const handleHeartbeat = useCallback((hb: HeartbeatPayload) => {
    lastSeenRef.current = Date.now();

    setState({
      lastSeen: lastSeenRef.current,
      status: "online",
    });
  }, []);

  useEffect(() => {
    if (!uuid) {
      setState({
        lastSeen: null,
        status: "pending",
      });
      return;
    }

    if (isDev) {
      console.info("[MC LIVE] Subscribed to heartbeat", uuid);
    }

    wsManager.subscribeRaspberry(uuid, handleHeartbeat);

    const interval = setInterval(() => {
      if (!lastSeenRef.current) {
        setState((prev) => ({
          ...prev,
          status: "offline",
        }));
        return;
      }

      const isOnline =
        Date.now() - lastSeenRef.current < ONLINE_TIMEOUT_MS;

      setState((prev) => ({
        ...prev,
        status: isOnline ? "online" : "offline",
      }));
    }, CHECK_INTERVAL_MS);

    return () => {
      if (isDev) {
        console.info("[MC LIVE] Unsubscribed from heartbeat", uuid);
      }

      wsManager.unsubscribeRaspberry(uuid, handleHeartbeat);
      clearInterval(interval);

      lastSeenRef.current = null;
    };
  }, [uuid, handleHeartbeat]);

  return state;
}
