import { useEffect, useRef } from "react";
import { wsManager } from "@/ws/WebSocketManager";

export function useInverterLive(serial: string, onUpdate: (data: any) => void) {
  const cbRef = useRef(onUpdate);
  cbRef.current = onUpdate;

  useEffect(() => {
    if (!serial) return;

    const handler = (data: any) => cbRef.current(data);

    wsManager.subscribeInverter(serial, handler);

    return () => {
      wsManager.unsubscribeInverter(serial);
    };

  }, [serial]);
}
