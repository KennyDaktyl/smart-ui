export type SchedulerDayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export type SchedulerSlot = {
  day_of_week: SchedulerDayOfWeek;
  start_time?: string;
  end_time?: string;
  start_local_time?: string;
  end_local_time?: string;
  start_utc_time?: string;
  end_utc_time?: string;
  use_power_threshold?: boolean;
  power_threshold_value?: number | null;
  power_threshold_unit?: string | null;
};

export type Scheduler = {
  id: number;
  uuid: string;
  name: string;
  timezone?: string | null;
  utc_offset_minutes?: number | null;
  slots: SchedulerSlot[];
  created_at: string;
  updated_at: string;
};

export type SchedulerPayload = {
  name: string;
  timezone: string;
  utc_offset_minutes: number;
  slots: SchedulerSlot[];
};

export type SchedulerPowerUnitProvider = {
  id: number;
  uuid: string;
  name: string;
  unit: string;
};

export type SchedulerPowerUnitsResponse = {
  units: string[];
  providers?: SchedulerPowerUnitProvider[];
};
