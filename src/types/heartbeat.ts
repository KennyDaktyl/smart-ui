export interface HeartbeatPayload {
    uuid: string;
    status: string;
    sent_at?: string;
    gpio_count?: number;
    device_count?: number;
    gpio?: Record<number, number>;
    devices?: Array<{ device_id: string; pin: number; is_on: boolean }>;
}