export type ProviderType = "api" | "sensor";

export type ProviderKind =
  | "power"
  | "temperature"
  | "light"
  | string;

export type ProviderVendor =
  | "huawei"
  | "goodwe"
  | "dht22"
  | "bme280"
  | string;

export type PowerUnit =
  | "kW"
  | "W"
  | "C"
  | "lux"
  | string;

export interface ProviderCreatePayload {
  /**
   * Human-readable name
   */
  name: string;

  /**
   * Classification
   */
  provider_type: ProviderType;
  kind: ProviderKind;
  vendor: ProviderVendor;

  /**
   * Optional vendor-specific deduplication key
   */
  external_id?: string | null;

  /**
   * Measurement unit
   */
  unit?: PowerUnit | null;

  /**
   * Allowed value range
   */
  value_min: number;
  value_max: number;

  /**
   * Lifecycle
   */
  enabled?: boolean;

  /**
   * Vendor-specific runtime config
   */
  config: Record<string, unknown>;

  /**
   * Provider credentials (write-only)
   */
  credentials?: Record<string, string>;
}
