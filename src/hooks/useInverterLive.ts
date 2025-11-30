import { useEffect, useRef } from "react";

const WS_URL = import.meta.env.VITE_WS_URL || "ws://localhost:8765";

export function useInverterLive(
  serial: string,
  onUpdate: (data: {
    serial_number: string;
    active_power: number | null;
    status: string;
    timestamp?: string;
    error_message?: string | null;
  }) => void,
  timeoutMs: number = 5 * 60 * 1000
) {
  const wsRef = useRef<WebSocket | null>(null);
  const lastMessageRef = useRef<number>(Date.now());
  const timeoutRef = useRef<number | null>(null);

  useEffect(() => {
    if (!serial) return;

    let reconnectTimeout: number;
    let ws: WebSocket;

    const checkTimeout = () => {
      const now = Date.now();
      const diff = now - lastMessageRef.current;

      if (diff > timeoutMs) {
        onUpdate({
          serial_number: serial,
          active_power: null,
          status: "offline",
          error_message: "Brak danych z inwertera",
        });
      }

      timeoutRef.current = window.setTimeout(checkTimeout, 10_000);
    };

    const connect = () => {
      ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log(`🔌 WS connected for inverter ${serial}`);
        ws.send(JSON.stringify({ action: "subscribe", serial }));
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === "inverter_update" && msg.data.serial_number === serial) {
            lastMessageRef.current = Date.now();
            onUpdate(msg.data);
          }
        } catch (err) {
          console.error("WebSocket parse error:", err);
        }
      };

      ws.onerror = () => {
        ws.close();
      };

      ws.onclose = () => {
        reconnectTimeout = window.setTimeout(connect, 5000);
      };
    };

    connect();
    checkTimeout();

    return () => {
      clearTimeout(reconnectTimeout);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      ws.close();
    };
  }, [serial, onUpdate, timeoutMs]);
}
