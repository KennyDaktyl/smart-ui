import { Device } from "@/features/devices/types/device";
import { Provider } from "@/features/providers/types";
import type { ProviderInstance } from "@/features/providers/types/provider";

export const MANUAL_PROVIDER_OPTION = "manual";


export enum MicrocontrollerType {
  RASPBERRY_PI_ZERO = "raspberry_pi_zero",
}


export interface Microcontroller {
  id: number;
  uuid: string;

  name: string;
  description: string | null;
  software_version: string | null;

  type: MicrocontrollerType;
  max_devices: number;
  enabled: boolean;

  assigned_sensors: string[];

  active_provider: Provider | null;
  devices: Device[];
  available_api_providers?: ProviderInstance[];
  available_sensor_providers?: ProviderInstance[];
}

export enum PowerUnit {
  WATT = "W",
  KILOWATT = "kW",
  WATT_HOUR = "Wh",
  KILOWATT_HOUR = "kWh",
  VOLT = "V",
  AMPERE = "A",
  HERTZ = "Hz",
  CELSIUS = "C",
  FAHRENHEIT = "F",
  KELVIN = "K",
  PERCENT = "%",
  LUX = "lux",
  BOOLEAN = "bool",
  STATE = "state",
  NONE = "none",
}

export type SensorCode = string;
