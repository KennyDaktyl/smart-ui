export interface AdminProvider {
  id: number;
  uuid: string;
  microcontroller_id: number;
  name: string;
  provider_type: "api" | "sensor" | "manual_or_scheduled";
  kind: string;
  vendor: string;
  unit: string;
  value_min: number | null;
  value_max: number | null;
  last_value: number | null;
  last_measurement_at: string | null;
  enabled: boolean;
  config?: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface AdminDevice {
  id: number;
  uuid: string;
  name: string;
  mode: string;
  rated_power_kw?: number | null;
  is_on: boolean;
}

export interface AdminMicrocontroller {
  id: number;
  uuid: string;
  user_id: number;

  name: string | null;
  description?: string | null;
  software_version?: string | null;
  type: string;

  max_devices: number;
  enabled: boolean;

  power_provider: AdminProvider | null;
  sensor_providers: AdminProvider[];

  active_provider: AdminProvider | null;
  available_sensor_providers: AdminProvider[];
  available_api_providers: AdminProvider[];

  assigned_sensors: string[];
  devices: AdminDevice[];

  created_at: string;
  updated_at: string;
}


export interface AdminUserDetails {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;

  microcontrollers: AdminMicrocontroller[];

  profile?: {
    first_name: string;
    last_name: string;
    phone_number: string;
    company_name?: string;
    company_vat?: string;
    company_address?: string;
    id: number;
  };
}

export interface AdminUserSummary {
  id: number;
  email: string;
  role: string;
  is_active: boolean;
  created_at: string;
}