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
  extra_data?: Record<string, unknown> | null;
  created_at?: string;
};

export type TelemetryChartType = "line" | "bar";
export type TelemetryAggregationMode = "raw" | "hourly_integral";
export type ProviderTelemetryCapability =
  | "power_meter"
  | "energy_storage"
  | "thermal";

export type ProviderTelemetryMetricDefinition = {
  metric_key: string;
  label: string;
  unit?: string | null;
  chart_type: TelemetryChartType;
  aggregation_mode: TelemetryAggregationMode;
  capability_tag?: ProviderTelemetryCapability | null;
};

export type ProviderMetricPoint = {
  timestamp: string;
  value: number;
};

export type ProviderMetricHourlyPoint = {
  hour: string;
  value: number;
};

export type ProviderMetricSeries = {
  metric_key: string;
  label: string;
  unit?: string | null;
  source_unit?: string | null;
  chart_type: TelemetryChartType;
  aggregation_mode: TelemetryAggregationMode;
  capability_tag?: ProviderTelemetryCapability | null;
  date: string;
  entries: ProviderMetricPoint[];
  hours: ProviderMetricHourlyPoint[];
};

export type ProviderMeasurementSeries = {
  unit: string | null;
  entries: ProviderMeasurement[];
};

export type HourlyEnergyPoint = {
  hour: string;
  energy: number;
  revenue?: number | null;
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

export type MarketEnergyPricePoint = {
  interval_start: string;
  interval_end: string;
  price: number;
  currency: string;
  unit: string;
};

export type ProviderMarketPrice = {
  market: string;
  label: string;
  price: number;
  currency: string;
  unit: string;
  interval_start: string;
  interval_end: string;
  source_updated_at?: string | null;
  price_per_energy_unit?: number | null;
  energy_unit?: string | null;
  history: MarketEnergyPricePoint[];
};

export type ProviderMatchedRevenue = {
  market: string;
  label: string;
  currency: string;
  energy_unit?: string | null;
  total_export_energy: number;
  total_revenue: number;
  matched_intervals: number;
  hours: {
    hour: string;
    revenue: number;
    export_energy: number;
  }[];
};

export type ProviderTelemetryResponse = {
  provider: ProviderResponse;
  date: string;
  measured_unit?: string | null;
  energy_unit?: string | null;
  day: DayEnergy;
  metrics: ProviderMetricSeries[];
  settlement_price?: ProviderMarketPrice | null;
  forecast_price?: ProviderMarketPrice | null;
  matched_revenue?: ProviderMatchedRevenue | null;
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
  has_power_meter: boolean;
  has_energy_storage: boolean;

  config: Record<string, any>;
  telemetry_metrics: ProviderTelemetryMetricDefinition[];
  enabled: boolean;

  created_at: string;
  updated_at: string;
  last_value?: ProviderMeasurement | null;
}
