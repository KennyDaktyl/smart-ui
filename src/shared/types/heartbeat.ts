import { ApiDevice } from "../../features/devices/types/device";

export interface HeartbeatPayload {
    uuid: string;
    status: string;
    sent_at?: string;
    timestamp?: number;
    expected_interval_sec?: number | string;
    heartbeat_interval_sec?: number | string;
    heartbeat_interval?: number | string;
    expectedIntervalSec?: number | string;
    heartbeatIntervalSec?: number | string;
    heartbeatInterval?: number | string;
    interval_sec?: number | string;
    interval?: number | string;
    event_type?: string;
    gpio_count?: number;
    device_count?: number;
    gpio?: Record<number, number>;
    devices?: Array<{ device_id: string; pin: number; is_on: boolean }>;
}


export interface LiveDevice {
    device_id: number;
    pin: number;
    is_on: boolean;
  }
  
export interface UiDevice extends ApiDevice {
    online: boolean;
    live_pin: number | null;
    is_on: boolean;
    waitingForState?: boolean;
}
