export type HuaweiConfig = {
  station_code?: string;
  inverter_id?: number;
  name?: string;
  model?: string;
  inv_type?: string;
  software_version?: string;
  optimizer_count?: number;
  latitude?: number;
  longitude?: number;
  min_power_kw?: number;
  max_power_kw?: number;
};

export type GoodWeConfig = {
  powerstation_id?: string;
  station_name?: string;
  address?: string;
  capacity_kw?: number;
  battery_capacity_kwh?: number;
  powerstation_type?: string;
  currency?: string;
  inverter_sn?: string | null;
  max_power_kw?: number;
};
