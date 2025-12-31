export type ProviderType = "api" | "sensor";

export interface ProviderDefinitionVendor {
  vendor: string;
  label: string;
  kind: string;
  default_unit: string;
  requires_wizard: boolean;
}

export interface ProviderTypeDefinition {
  type: ProviderType;
  vendors: ProviderDefinitionVendor[];
}

export interface ProviderDefinitionsResponse {
  provider_types: ProviderTypeDefinition[];
}
