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

export interface ProviderMeasurement {
  id: number;
  measured_at: string;
  measured_value: number;
  measured_unit: string | null;
  metadata_payload: Record<string, any>;
}

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
