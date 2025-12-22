export interface Device {
  id: number;
  uuid: string;
  microcontroller_id: number;

  name: string;
  device_number: number;
  mode: DeviceMode;

  provider_id: number | null;
  rated_power_w: number | null;
  threshold_value: number | null;

  manual_state: boolean | null;
  last_state_change_at: string | null;

  created_at: string;
  updated_at: string;
}

export interface DeviceFormData {
  name: string;
  mode: DeviceUIMode;
  rated_power_w: number | "";
  threshold_value: number | "";
}

export enum DeviceMode {
  MANUAL = "MANUAL",
  AUTO = "AUTO",
  SCHEDULE = "SCHEDULE",
}

export enum DeviceUIMode {
  MANUAL = "MANUAL",
  AUTO_POWER = "AUTO_POWER",
  SCHEDULE = "SCHEDULE",
}