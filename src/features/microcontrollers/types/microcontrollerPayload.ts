import { MicrocontrollerType } from "@/features/microcontrollers/types/microcontrollerType";
import { MicrocontrollerProviderConfig } from "./microcontroller";
import { DeviceMode } from "@/features/devices/enums/deviceMode";

export type CreateMicrocontrollerPayload = {
  user_id?: number | null;
  name: string;
  description?: string;
  software_version?: string;
  type: MicrocontrollerType;
  max_devices: number;
  assigned_sensors: string[];
};

export type EditMicrocontrollerPayload = {
  user_id?: number | null;
  name?: string;
  description?: string;
  software_version?: string;
  max_devices?: number;
  enabled?: boolean;
  assigned_sensors?: string[];
};

export type DeviceConfig = {
  device_id: number;
  pin_number: number;
  mode: DeviceMode;
  threshold_value?: number | null;
  is_on?: boolean | null;
};

export type UpdateMicrocontrollerConfigPayload = {
  uuid?: string | null;
  device_max?: number;
  active_low?: boolean;
  devices_config?: DeviceConfig[];
  provider?: MicrocontrollerProviderConfig;
};