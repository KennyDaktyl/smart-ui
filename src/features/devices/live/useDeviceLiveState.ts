import { useEffect, useState } from "react";
import { wsManager } from "@/ws/WebSocketManager";

const HEARTBEAT_EVENT = "microcontroller_heartbeat";

// ============================================================
// Types
// ============================================================

export type DeviceLiveState = {
  isOn: boolean;
  mode?: string | null;
  threshold?: number | null;
  seenAt: number;
};

type DeviceLiveMap = Record<number, DeviceLiveState>;

type MicrocontrollerHeartbeatEvent = {
  event_type: "HEARTBEAT";
  payload: {
    uuid: string;
    status: "online" | "offline";
    timestamp: number;
    devices: Array<{
      device_id: number;
      is_on: boolean;
      mode?: string | null;
      threshold?: number | null;
    }>;
  };
};

// ============================================================
// Hook
// ============================================================

export function useDeviceLiveState(microcontrollerUuid?: string) {
  const [state, setState] = useState<DeviceLiveMap>({});

  useEffect(() => {
    if (!microcontrollerUuid) return;

    const handler = (event: MicrocontrollerHeartbeatEvent) => {
      console.debug("[WS][HEARTBEAT][DEVICES]", event);

      const devices = event.payload?.devices;
      if (!Array.isArray(devices)) return;

      const next: DeviceLiveMap = {};

      devices.forEach((device) => {
        if (device.device_id == null) return;

        next[device.device_id] = {
          isOn: Boolean(device.is_on),
          mode: device.mode ?? null,
          threshold: device.threshold ?? null,
          seenAt: Date.now(),
        };
      });

      setState(next);
    };

    wsManager.subscribe(microcontrollerUuid, HEARTBEAT_EVENT, handler);

    return () => {
      wsManager.unsubscribe(microcontrollerUuid, HEARTBEAT_EVENT, handler);
    };
  }, [microcontrollerUuid]);

  return state;
}
