// src/features/microcontrollers/hooks/useMicrocontrollerLive.ts
import { useCallback, useEffect, useRef, useState } from "react";
import { wsManager } from "@/ws/WebSocketManager";
import { HeartbeatPayload } from "@/shared/types/heartbeat";

type LiveState = {
  lastSeen: number | null;
  online: boolean;
};

const ONLINE_TIMEOUT_MS = 15_000;

export function useMicrocontrollerLive(uuid?: string) {
  const [state, setState] = useState<LiveState>({
    lastSeen: null,
    online: false,
  });

  const lastSeenRef = useRef<number | null>(null);

  const handleHeartbeat = useCallback((hb: HeartbeatPayload) => {
    lastSeenRef.current = Date.now();

    setState({
      lastSeen: lastSeenRef.current,
      online: true,
    });
  }, []);

  useEffect(() => {
    if (!uuid) return;

    console.info("[MC DETAILS] Subscribed to heartbeat", uuid);
    wsManager.subscribeRaspberry(uuid, handleHeartbeat);

    const interval = setInterval(() => {
      if (!lastSeenRef.current) return;

      const isOnline =
        Date.now() - lastSeenRef.current < ONLINE_TIMEOUT_MS;

      setState((prev) => ({
        ...prev,
        online: isOnline,
      }));
    }, 5_000);

    return () => {
      console.info("[MC DETAILS] Unsubscribed from heartbeat", uuid);
      wsManager.unsubscribeRaspberry(uuid, handleHeartbeat);
      clearInterval(interval);
    };
  }, [uuid, handleHeartbeat]);

  return state;
}
