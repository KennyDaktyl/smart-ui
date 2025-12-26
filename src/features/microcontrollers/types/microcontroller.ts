import { UserRole } from "@/features/users/types/role";
import { MicrocontrollerType } from "./microcontrollerType";

export type MicrocontrollerResponse = {
  id: number;
  uuid: string;

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

  assigned_sensors: string[];
  config?: MicrocontrollerConfig;
  enabled: boolean;

  created_at: string;
  updated_at: string;
};


export type MicrocontrollerConfig = {
  uuid?: string | null;
  device_max?: number;
  active_low?: boolean;
  pins?: number[];
  provider?: MicrocontrollerProviderConfig;
};

export type MicrocontrollerProviderConfig = {
  uuid?: string;
  external_id?: string;
};
