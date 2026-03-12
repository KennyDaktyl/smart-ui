//src/features/microcontrollers/types/microcontroller.ts
import { Device } from "@/features/devices/types/devicesType";
import { ProviderResponse } from "@/features/providers/types/userProvider";
import { UserRole } from "@/features/users/types/role";

export enum MicrocontrollerType {
  RASPBERRY_PI_ZERO = "raspberry_pi_zero",
  RASPBERRY_PI_4 = "raspberry_pi_4",
}

export const MICROCONTROLLER_TYPE_VALUES = Object.values(MicrocontrollerType);

export type MicrocontrollerResponse = {
  id: number;
  uuid: string;
  user_id?: number;

  user?: {
    id: number;
    email: string;
    role: UserRole
  };
  name: string;
  description?: string | null;
  software_version?: string | null;

  type: MicrocontrollerType;
  max_devices: number;

  devices: Device[]

  assigned_sensors: string[];
  available_api_providers?: ProviderResponse[];
  power_provider_id?: number | null;
  power_provider?: ProviderResponse | null;
  config?: MicrocontrollerConfig;
  enabled: boolean;

  created_at: string;
  updated_at: string;
};


export type MicrocontrollerConfig = {
  uuid?: string | null;
  device_max?: number;
  active_low?: boolean;
  available_sensors?: string[];
  pins?: number[];
  provider?: MicrocontrollerProviderConfig;
};

export type MicrocontrollerProviderConfig = {
  uuid?: string;
  external_id?: string;
};

export type MicrocontrollerWithLive = {
  mc: MicrocontrollerResponse;
  liveInitialized: boolean;
  isOnline: boolean;
  lastSeen: string | null;
  live: any[];
};
