import { DeviceMode, DeviceUIMode } from "./device";

export function mapUIModeToApi(mode: DeviceUIMode): DeviceMode {
  switch (mode) {
    case DeviceUIMode.MANUAL:
      return DeviceMode.MANUAL;

    case DeviceUIMode.SCHEDULE:
      return DeviceMode.SCHEDULE;

    case DeviceUIMode.AUTO_POWER:
      return DeviceMode.AUTO;

    default: {
      const _exhaustive: never = mode;
      throw new Error(`Unhandled DeviceUIMode: ${_exhaustive}`);
    }
  }
}