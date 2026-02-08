import { useEffect, useState } from "react";
import { wsManager } from "@/ws/WebSocketManager";

const HEARTBEAT_EVENT = "microcontroller_heartbeat";

export type DeviceLiveState = {
  isOn: boolean;
  mode?: string | null;
  threshold?: number | null;
  seenAt: number;
};

type DeviceLiveMap = Record<number, DeviceLiveState>;

export function useDeviceLiveState(microcontrollerUuid?: string) {
  const [state, setState] = useState<DeviceLiveMap>({});

  useEffect(() => {
    if (!microcontrollerUuid) return;

    const handler = (msg: any) => {
      const devices = msg?.data?.payload?.devices;
      if (!Array.isArray(devices)) return;

      const next: DeviceLiveMap = {};

      devices.forEach((device: any) => {
        if (device?.device_id == null) return;

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
