export interface AdminUserSummary {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
  huawei_username?: string | null;
}

export interface AdminDevice {
  id: number;
  uuid: string;
  name: string;
  device_number?: number | null;
  mode: string;
  rated_power_kw?: number | null;
  threshold_kw?: number | null;
  hysteresis_w?: number | null;
  schedule?: any;
  raspberry_id?: number | null;
  user_id?: number | null;
  is_on: boolean;
  last_update: string;
}

export interface AdminRaspberry {
  id: number;
  uuid: string;
  name: string;
  description?: string | null;
  software_version?: string | null;
  max_devices: number;
  user_id?: number | null;
  inverter_id?: number | null;
  devices: AdminDevice[];
}

export interface AdminInverter {
  id: number;
  installation_id: number;
  serial_number: string;
  name?: string | null;
  model?: string | null;
  capacity_kw?: number | null;
  dev_type_id?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  last_updated: string;
  raspberries?: AdminRaspberry[];
}

export interface AdminInstallation {
  id: number;
  user_id: number;
  name: string;
  station_code: string;
  station_addr?: string | null;
  inverters?: AdminInverter[];
}

export interface AdminUserDetails {
  id: number;
  email: string;
  role: string;
  is_active?: boolean;
  created_at: string;
  huawei_username?: string | null;
  installations: AdminInstallation[];
}
