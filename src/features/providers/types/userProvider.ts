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

export type ProviderMeasurement = {
  id?: number;
  provider_uuid?: string;
  measured_at: string;
  measured_value: number | null;
  measured_unit?: string | null;
  metadata_payload?: Record<string, unknown> | null;
  created_at?: string;
};

export type ProviderMeasurementSeries = {
  unit: string | null;
  entries: ProviderMeasurement[];
};

export type HourlyEnergyPoint = {
  hour: string;
  energy: number;
};

export type LegacyEnergyEntryPoint = {
  timestamp: string;
  energy: number;
};

export type ProviderTelemetryEntry =
  | LegacyEnergyEntryPoint
  | ProviderMeasurement;

export type DayEnergy = {
  date: string;
  total_energy?: number;
  import_energy?: number;
  export_energy?: number;
  hours?: HourlyEnergyPoint[];
  entries: ProviderTelemetryEntry[];
};

export type ProviderEnergySeries = {
  days?: Record<
    string,
    {
      date?: string;
      entries?: ProviderTelemetryEntry[];
      total_energy?: number;
      import_energy?: number;
      export_energy?: number;
      hours?: HourlyEnergyPoint[];
    }
  >;
  entries?: ProviderTelemetryEntry[];
  date?: string;
  unit?: string | null;
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
  power_source?: "inverter" | "meter" | null;

  value_min?: number | null;
  value_max?: number | null;

  default_expected_interval_sec: number;

  config: Record<string, any>;
  enabled: boolean;

  created_at: string;
  updated_at: string;
  last_value?: ProviderMeasurement | null;
}
