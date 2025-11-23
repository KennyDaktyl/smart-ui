// src/hooks/useRaspberryLive.ts
import { useEffect, useRef } from "react";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8765";

interface HeartbeatPayload {
  uuid: string;
  status: string;
  timestamp?: number;
  gpio?: Record<number, number>;
  devices?: Array<{ device_id: string; pin: number; is_on: boolean }>;
  free_slots?: number;
}

export function useRaspberryLive(onUpdate: (data: HeartbeatPayload) => void) {
  const wsRef = useRef<WebSocket | null>(null);
  const lastSeenRef = useRef<Record<string, number>>({});

  useEffect(() => {
    let reconnectTimeout: number;
    let ws: WebSocket;

    const connect = () => {
      ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log("✅ WebSocket connected for Raspberry heartbeats");
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);
          console.log("📨 WS message:", msg);

          if (msg.type === "raspberry_heartbeat") {
            const data: HeartbeatPayload = msg.data;

            // zapisz timestamp ostatniego kontaktu
            lastSeenRef.current[data.uuid] = Date.now();

            console.log("💓 Heartbeat full payload:", data);

            // 🔥 TERAZ WYSYŁAMY CAŁE DANE
            onUpdate(data);
          }
        } catch (err) {
          console.error("❌ WebSocket parse error (raspberry):", err, event.data);
        }
      };

      ws.onclose = () => {
        console.warn("🔌 WebSocket closed, reconnecting in 5s...");
        reconnectTimeout = window.setTimeout(connect, 5000);
      };

      ws.onerror = (err) => {
        console.error("⚠️ WebSocket error:", err);
        ws.close();
      };
    };

    connect();

    // watchdog offline
    const interval = setInterval(() => {
      const now = Date.now();
      for (const [uuid, ts] of Object.entries(lastSeenRef.current)) {
        if (now - ts > 60000) {
          console.warn(`🔴 ${uuid} marked offline (no heartbeat >60s)`);

          onUpdate({
            uuid,
            status: "offline",
          });

          delete lastSeenRef.current[uuid];
        }
      }
    }, 30000);

    return () => {
      clearTimeout(reconnectTimeout);
      clearInterval(interval);
      ws.close();
    };
  }, [onUpdate]);
}
