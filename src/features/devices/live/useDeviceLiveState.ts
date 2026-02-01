import { useEffect, useRef, useState } from "react";
import { wsManager } from "@/ws/WebSocketManager";

const HEARTBEAT_EVENT = "microcontroller_heartbeat";

export type DeviceLiveState = {
  isOn: boolean;
  mode?: string | null;
  threshold?: number | null;
};

type DeviceLiveMap = Record<number, DeviceLiveState>;

type Entry = {
  handler: (payload: any) => void;
};

export function useDeviceLiveState(microcontrollerUuid?: string) {
  const [state, setState] = useState<DeviceLiveMap>({});
  const subRef = useRef<Entry | null>(null);

  useEffect(() => {
    if (!microcontrollerUuid) return;

    const handler = (payload: any) => {
      const devices =
        payload?.payload?.devices ??
        payload?.data?.devices ??
        payload?.devices ??
        [];

      if (!Array.isArray(devices)) return;

      setState((prev) => {
        const next: DeviceLiveMap = { ...prev };
        devices.forEach((device: any) => {
          if (device?.device_id == null) return;
          next[device.device_id] = {
            isOn: Boolean(device.is_on),
            mode: device.mode ?? null,
            threshold: device.threshold ?? null,
          };
        });
        return next;
      });
    };

    wsManager.subscribe(microcontrollerUuid, HEARTBEAT_EVENT, handler);
    subRef.current = { handler };

    return () => {
      if (subRef.current) {
        wsManager.unsubscribe(microcontrollerUuid, HEARTBEAT_EVENT, subRef.current.handler);
        subRef.current = null;
      }
    };
  }, [microcontrollerUuid]);

  return state;
}
