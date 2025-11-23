export interface HeartbeatPayload {
    uuid: string;
    status: string;
    timestamp?: number;
    gpio?: Record<number, number>;
    devices?: Array<{ device_id: string; pin: number; is_on: boolean }>;
    free_slots?: number;
}
  