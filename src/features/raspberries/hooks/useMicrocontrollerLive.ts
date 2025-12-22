import { useCallback, useEffect, useRef } from "react";
import { wsManager } from "@/ws/WebSocketManager";
import { HeartbeatPayload } from "@/shared/types/heartbeat";

export function useMicrocontrollerLive(uuid: string, onUpdate: (hb: HeartbeatPayload) => void) {
  const cbRef = useRef(onUpdate);
  cbRef.current = onUpdate;
  const handler = useCallback((hb: HeartbeatPayload) => cbRef.current(hb), []);

  useEffect(() => {
    if (!uuid) return;

    wsManager.subscribeRaspberry(uuid, handler);

    return () => {
      wsManager.unsubscribeRaspberry(uuid, handler);

    };
  }, [uuid, handler]);
}
