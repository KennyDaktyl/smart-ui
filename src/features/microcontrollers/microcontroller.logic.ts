import { Microcontroller } from "./components/types";

export function canAddDevice(mc: Microcontroller): boolean {
  return mc.devices.length < mc.max_devices;
}

export function remainingDeviceSlots(mc: Microcontroller): number {
  return Math.max(mc.max_devices - mc.devices.length, 0);
}
