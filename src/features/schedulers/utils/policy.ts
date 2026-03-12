import type { DeviceDependencyRule } from "@/features/devices/types/dependency";
import type { Scheduler, SchedulerControlPolicy, SchedulerSlot } from "@/features/schedulers/types/scheduler";

export const DEFAULT_TEMPERATURE_POLICY_SENSOR_ID = "temperature";
export const TEMPERATURE_SENSOR_CAPABILITIES = ["ds18b20", "temperature"] as const;

function getControlPolicy(slot: SchedulerSlot): SchedulerControlPolicy | null {
  return slot.control_policy ?? slot.control_policy_json ?? null;
}

export function getSlotDependencyRule(
  slot: SchedulerSlot,
): DeviceDependencyRule | null {
  return slot.device_dependency_rule ?? slot.device_dependency_rule_json ?? null;
}

export function slotUsesTemperaturePolicy(slot: SchedulerSlot): boolean {
  if (slot.control_mode !== "POLICY") {
    return false;
  }

  const policy = getControlPolicy(slot);
  return policy?.policy_type === "TEMPERATURE_HYSTERESIS";
}

export function schedulerUsesTemperaturePolicy(scheduler: Scheduler): boolean {
  return (scheduler.slots ?? []).some(slotUsesTemperaturePolicy);
}

export function schedulerUsesDeviceDependency(scheduler: Scheduler): boolean {
  return (scheduler.slots ?? []).some((slot) => getSlotDependencyRule(slot) != null);
}

export function hasTemperatureSensorCapability(
  assignedSensors: string[] | null | undefined,
): boolean {
  const normalized = new Set(
    (assignedSensors ?? [])
      .map((sensor) => sensor.trim().toLowerCase())
      .filter(Boolean),
  );

  return TEMPERATURE_SENSOR_CAPABILITIES.some((sensor) => normalized.has(sensor));
}
