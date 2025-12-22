export type ProviderType = "api" | "sensor" | "manual_or_scheduled";

export type VendorDefinition = {
  vendor: string;
  label: string;
  kind: string;
  default_unit: string;
  requires_wizard: boolean;
};

export type ProviderDefinition = VendorDefinition & {
  provider_type: ProviderType;
};

export type ProviderMetadataForm = {
  name: string;
  value_min: string;
  value_max: string;
  enabled: boolean;
};

export type WizardCredentials = {
  username: string;
  password: string;
};

export type ProviderInstance = {
  id?: number;
  uuid?: string;
  name?: string;
  provider_type?: string;
  kind?: string;
  microcontroller_id?: number | null;
  microcontroller_uuid?: string | null;
  vendor?: string;
  unit?: string;
  value_min?: number | null;
  value_max?: number | null;
  last_value?: number | null;
  last_measurement_at?: string | null;
  enabled?: boolean;
  config?: Record<string, any> | null;
  created_at?: string;
  updated_at?: string;
};
