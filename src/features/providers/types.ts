import { PowerUnit } from "../microcontrollers/components/types";

export interface Provider {
  id: number;
  uuid: string;
  name: string;

  unit: PowerUnit;
  provider_type: ProviderType;

  value_min: number | null;
  value_max: number | null;
}

export enum ProviderType {
  API = "api",
  SENSOR = "sensor",
}
