import type {
  AutomationRuleGroupPayload,
} from "@/features/automation/types/rules";
import type { DeviceDependencyRule } from "@/features/devices/types/dependency";

export type SchedulerDayOfWeek =
  | "MONDAY"
  | "TUESDAY"
  | "WEDNESDAY"
  | "THURSDAY"
  | "FRIDAY"
  | "SATURDAY"
  | "SUNDAY";

export type SchedulerActivationRule = AutomationRuleGroupPayload;
export type SchedulerControlMode = "DIRECT" | "POLICY";
export type SchedulerPolicyEndBehavior = "KEEP_CURRENT_STATE" | "FORCE_OFF";

export type SchedulerControlPolicy = {
  policy_type: "TEMPERATURE_HYSTERESIS";
  sensor_id: string;
  target_temperature_c: number;
  stop_above_target_delta_c: number;
  start_below_target_delta_c: number;
  heat_up_on_activate: boolean;
  end_behavior: SchedulerPolicyEndBehavior;
};

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
  control_mode?: SchedulerControlMode;
  control_policy?: SchedulerControlPolicy | null;
  control_policy_json?: SchedulerControlPolicy | null;
  device_dependency_rule?: DeviceDependencyRule | null;
  device_dependency_rule_json?: DeviceDependencyRule | null;
  activation_rule?: SchedulerActivationRule | null;
  activation_rule_json?: SchedulerActivationRule | null;
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
