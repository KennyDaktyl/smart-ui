export type DeviceEvent = {
  id: number;
  device_id: number;
  event_type: string;
  event_name: string;
  device_state: string | null;
  pin_state: boolean;
  measured_value: number | null;
  measured_unit: string | null;
  trigger_reason: string | null;
  source: string | null;
  created_at: string;
};

export type DeviceEventsResponse = {
  events: DeviceEvent[];
  total_minutes_on: number | null;
  energy_kwh: number | null;
  rated_power_kw: number | null;
};
