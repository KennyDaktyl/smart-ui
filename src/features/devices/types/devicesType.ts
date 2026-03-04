import type { DeviceMode } from "@/features/devices/enums/deviceMode";

export type Device = {
  id: number;
  uuid: string;

  name: string;
  device_number: number;

  rated_power?: number | null;

  mode: DeviceMode;
  manual_state?: boolean | null;
  threshold_value?: number | null;
  scheduler_id?: number | null;

  provider_id?: number | null;
  microcontroller_id: number;

  last_state_change_at?: string | null;

  created_at: string;
  updated_at: string;
};
