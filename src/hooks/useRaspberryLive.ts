import { HeartbeatPayload } from "@/types/heartbeat";
import { useEffect, useRef } from "react";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8765";

export function useRaspberryLive(
  uuids: string[],
  onUpdate: (data: HeartbeatPayload) => void
) {
  const wsRef = useRef<WebSocket | null>(null);
  const lastSeenRef = useRef<Record<string, number>>({});
  const subscribedRef = useRef<string[]>([]);   // zapamiętuje co już subskrybowaliśmy
  const connectedOnce = useRef(false);          // blokuje wielokrotne otwarcie WS

  /* ---------------------------------------------------------
   * 1️⃣  Otwórz WebSocket tylko raz przy pierwszym renderze
   * --------------------------------------------------------- */
  useEffect(() => {
    if (connectedOnce.current) return;
    connectedOnce.current = true;

    let reconnectTimeout: number;

    const connect = () => {
      console.log("🔌 Opening WebSocket connection…");

      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("✅ WebSocket connected");

        // wyślij suby po połączeniu
        if (subscribedRef.current.length > 0) {
          ws.send(JSON.stringify({
            action: "subscribe_many",
            uuids: subscribedRef.current
          }));
          console.log("🔄 Re-subscribed to:", subscribedRef.current);
        }
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === "raspberry_heartbeat") {
            const data: HeartbeatPayload = msg.data;

            if (!subscribedRef.current.includes(data.uuid)) {
              console.log(`⛔ Ignoring heartbeat for non-subscribed UUID: ${data.uuid}`);
              return;
            }

            lastSeenRef.current[data.uuid] = Date.now();

            onUpdate(data);
          }
        } catch (err) {
          console.error("❌ WS parse error", err);
        }
      };

      ws.onclose = () => {
        console.warn("🟥 WS closed — reconnect in 3s");
        reconnectTimeout = window.setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error("🔥 WS error:", err);
        ws.close();
      };
    };

    connect();

  const interval = setInterval(() => {
    const now = Date.now();

    for (const [uuid, ts] of Object.entries(lastSeenRef.current)) {
      if (now - ts > 12_000) {
        console.warn(`🔴 ${uuid} offline (no heartbeat > 12s)`);

        onUpdate({
          uuid,
          status: "offline",
          sent_at: undefined
        });

        delete lastSeenRef.current[uuid];
      }
    }
  }, 3000);


    return () => {
      window.clearTimeout(reconnectTimeout);
      clearInterval(interval);
      wsRef.current?.close();
    };
  }, [onUpdate]);

  /* ---------------------------------------------------------
   * 2️⃣  Wyślij subskrypcje tylko wtedy gdy zmienią się UUID-y
   * --------------------------------------------------------- */
  useEffect(() => {
    if (!uuids || uuids.length === 0) return;

    const sorted = [...uuids].sort(); // stabilne porównanie

    // jeśli tablica się nie zmieniła → nic nie rób
    if (JSON.stringify(subscribedRef.current) === JSON.stringify(sorted)) {
      return;
    }

    subscribedRef.current = sorted;

    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        action: "subscribe_many",
        uuids: sorted
      }));

      console.log("📡 Updated WS subscriptions:", sorted);
    }

  }, [uuids]);
}
