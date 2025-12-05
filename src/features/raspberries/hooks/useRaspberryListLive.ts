import { useEffect, useRef } from "react";
import { wsManager } from "@/ws/WebSocketManager";

export function useRaspberryListLive(
  uuids: string[],
  onUpdate: (data: any) => void
) {
  const cbRef = useRef(onUpdate);
  cbRef.current = onUpdate;

  useEffect(() => {
    if (!uuids || uuids.length === 0) return;

    const handler = (hb: any) => cbRef.current(hb);

    uuids.forEach((id) => wsManager.subscribeRaspberry(id, handler));

    return () => {
      uuids.forEach((id) => wsManager.unsubscribeRaspberry(id, handler));
    };
  }, [uuids]);
}
