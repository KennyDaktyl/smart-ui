export function getMaxDeviceSlots(devices: any[]): number {
    if (devices.length === 0) return 1;
    return Math.max(...devices.map((d) => d.device_number));
  }
  