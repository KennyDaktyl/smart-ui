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
  start_time: string;
  end_time: string;
};

export type Scheduler = {
  id: number;
  uuid: string;
  name: string;
  slots: SchedulerSlot[];
  created_at: string;
  updated_at: string;
};

export type SchedulerPayload = {
  name: string;
  slots: SchedulerSlot[];
};
