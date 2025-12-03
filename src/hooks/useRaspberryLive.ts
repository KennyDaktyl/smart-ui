import { useEffect } from "react";
import { wsManager } from "@/ws/WebSocketManager";
import { HeartbeatPayload } from "@/types/heartbeat";

export function useRaspberryLive(uuid: string, onUpdate: (hb: HeartbeatPayload) => void) {

  useEffect(() => {
    if (!uuid) return;

    wsManager.subscribeRaspberry(uuid, onUpdate);

    return () => {
      wsManager.unsubscribeRaspberry(uuid);
    };
  }, [uuid, onUpdate]);
}
