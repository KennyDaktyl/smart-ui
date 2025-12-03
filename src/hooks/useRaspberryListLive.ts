import { useEffect } from "react";
import { wsManager } from "@/ws/WebSocketManager";
import { HeartbeatPayload } from "@/types/heartbeat";

export function useRaspberryListLive(
  uuids: string[],
  onUpdate: (hb: HeartbeatPayload) => void
) {
  useEffect(() => {
    // Brak urządzeń – nic nie subskrybujemy
    if (!uuids || uuids.length === 0) return;

    // Subskrypcja dla każdego uuid
    uuids.forEach((uuid) => {
      wsManager.subscribeRaspberry(uuid, onUpdate);
    });

    return () => {
      uuids.forEach((uuid) => {
        wsManager.unsubscribeRaspberry(uuid);
      });
    };
  }, [JSON.stringify(uuids), onUpdate]);
}
