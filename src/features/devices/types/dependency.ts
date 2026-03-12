export type DeviceDependencyAction = "NONE" | "ON" | "OFF";

export type DeviceDependencyRule = {
  target_device_id: number;
  target_device_number?: number | null;
  when_source_on: DeviceDependencyAction;
  when_source_off: DeviceDependencyAction;
};
