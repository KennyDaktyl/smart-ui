import { ProviderType } from "./provider";

export interface UserProvider {
  id: number;
  uuid: string;
  name: string;

  provider_type: ProviderType;
  vendor?: string;
  kind: string;

  unit?: string;
  enabled: boolean;

  created_at: string;
}

export type HourlyEnergyPoint = {
  hour: string;
  energy: number;
};

export type DayEnergy = {
  date: string;
  total_energy: number;
  import_energy: number;
  export_energy: number;
  hours: HourlyEnergyPoint[];
};

export type ProviderEnergySeries = {
  days: Record<string, DayEnergy>;
  unit: string
};

export interface ProviderResponse {
  id: number;
  uuid: string;
  microcontroller_id: number | null;

  name: string;
  provider_type: string;
  kind: string;
  vendor: string;

  external_id?: string | null;
  unit?: string | null;

  value_min?: number | null;
  value_max?: number | null;

  default_expected_interval_sec: number;

  config: Record<string, any>;
  enabled: boolean;

  created_at: string;
  updated_at: string;
  last_value?: ProviderMeasurement | null;
}
