import { Stack } from "@mui/material";
import type { ReactNode } from "react";

import { StatusBadge } from "@/features/common/components/atoms/StatusBadge";
import { useDeviceLiveState } from "@/features/devices/live/useDeviceLiveState";

export type DeviceLiveWidgetState = {
  status: "pending" | "online" | "offline";
  isOn: boolean | null;
  mode: string | null;
  threshold: number | null;
  seenAt: number | null;
};

export type DeviceLiveWidgetProps = {
  uuid?: string;
  microcontrollerUuid?: string;
  deviceId?: number;
  children?: (live: DeviceLiveWidgetState) => ReactNode;
};

export function DeviceLiveWidget({
  uuid,
  microcontrollerUuid,
  deviceId,
  children,
}: DeviceLiveWidgetProps) {
  const resolvedMicrocontrollerUuid = microcontrollerUuid ?? uuid;
  const liveMap = useDeviceLiveState(resolvedMicrocontrollerUuid);
  const deviceLive = deviceId != null ? liveMap[deviceId] : undefined;

  const snapshot: DeviceLiveWidgetState = deviceLive
    ? {
        status: deviceLive.isOn ? "online" : "offline",
        isOn: deviceLive.isOn,
        mode: deviceLive.mode ?? null,
        threshold: deviceLive.threshold ?? null,
        seenAt: deviceLive.seenAt ?? null,
      }
    : {
        status: "pending",
        isOn: null,
        mode: null,
        threshold: null,
        seenAt: null,
      };

  if (children) return <>{children(snapshot)}</>;

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <StatusBadge status={snapshot.status} />
    </Stack>
  );
}
