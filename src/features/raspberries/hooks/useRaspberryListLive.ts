import { useCallback, useEffect, useRef } from "react";
import { wsManager } from "@/ws/WebSocketManager";

export function useRaspberryListLive(
  uuids: string[],
  onUpdate: (data: any) => void
) {
  const cbRef = useRef(onUpdate);
  cbRef.current = onUpdate;
  const handler = useCallback((hb: any) => cbRef.current(hb), []);
  const prevUuidsRef = useRef<string[]>([]);

  useEffect(() => {
    const prev = prevUuidsRef.current;
    const prevSet = new Set(prev);
    const nextSet = new Set(uuids);

    const added = uuids.filter((id) => !prevSet.has(id));
    const removed = prev.filter((id) => !nextSet.has(id));

    if (added.length === 0 && removed.length === 0) return;

    added.forEach((id) => wsManager.subscribeRaspberry(id, handler));
    removed.forEach((id) => wsManager.unsubscribeRaspberry(id, handler));

    prevUuidsRef.current = [...uuids];
  }, [uuids, handler]);

  useEffect(() => {
    return () => {
      prevUuidsRef.current.forEach((id) => wsManager.unsubscribeRaspberry(id, handler));
      prevUuidsRef.current = [];
    };
  }, [handler]);
}
