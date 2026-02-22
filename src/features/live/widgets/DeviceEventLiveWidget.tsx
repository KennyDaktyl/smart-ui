import type { ReactNode } from "react";

import {
  useDeviceEventLive,
  type DeviceEventLiveSnapshot,
  type UseDeviceEventLiveOptions,
} from "@/features/devices/live/useDeviceEventLive";

export type DeviceEventLiveWidgetProps = UseDeviceEventLiveOptions & {
  children?: (live: DeviceEventLiveSnapshot) => ReactNode;
};

export function DeviceEventLiveWidget({
  children,
  ...options
}: DeviceEventLiveWidgetProps) {
  const live = useDeviceEventLive(options);

  if (children) return <>{children(live)}</>;

  return null;
}
