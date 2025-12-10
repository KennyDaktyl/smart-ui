export interface DeviceTimelineEvent {
  timestamp: string;
  pin_state: boolean;
  power_kw?: number;
  trigger_reason?: string | null;
}

export interface DeviceEventsSummary {
  total_minutes_on?: number;
  energy_kwh?: number;
  rated_power_kw?: number;
}
