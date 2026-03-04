//src/features/microcontrollers/types/microcontrollerPayload.ts
import { MicrocontrollerProviderConfig, MicrocontrollerType } from "./microcontroller";
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

export type AgentConfigFilesPayload = {
  config_json: Record<string, unknown>;
  hardware_config_json: Record<string, unknown>;
  env_file_content: string;
};

export enum MicrocontrollerAgentCommand {
  READ_CONFIG_FILES = "READ_CONFIG_FILES",
  WRITE_CONFIG_FILES = "WRITE_CONFIG_FILES",
  REBOOT_AGENT = "REBOOT_AGENT",
  UPDATE_AGENT = "UPDATE_AGENT",
}

export type MicrocontrollerAgentCommandAck = {
  ok: boolean;
  command_id: string;
  command: MicrocontrollerAgentCommand;
  message?: string | null;
};

export type MicrocontrollerAgentConfigFilesResponse =
  MicrocontrollerAgentCommandAck & {
    config_json: Record<string, unknown>;
    hardware_config_json: Record<string, unknown>;
    env_file_content: string;
  };
