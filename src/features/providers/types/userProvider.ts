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

  last_value?: number | null;
  last_measurement_at?: string | null;
  config : Record<string, any>;
  enabled: boolean;

  created_at: string;
  updated_at: string;
}
