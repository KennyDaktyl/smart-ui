import { ApiDevice } from "./device";

export interface HeartbeatPayload {
    uuid: string;
    status: string;
    sent_at?: string;
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
