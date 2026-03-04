import { Stack } from "@mui/material";
import type { ReactNode } from "react";

import { StatusBadge } from "@/features/common/components/atoms/StatusBadge";
import {
  useMicrocontrollerLive,
  type LiveState,
} from "@/features/microcontrollers/hooks/useMicrocontrollerLive";

export type MicrocontrollerLiveWidgetProps = {
  uuid?: string;
  state?: LiveState;
  children?: (live: LiveState) => ReactNode;
};

export function MicrocontrollerLiveWidget({
  uuid,
  state,
  children,
}: MicrocontrollerLiveWidgetProps) {
  const live = state ?? useMicrocontrollerLive(uuid);

  if (children) return <>{children(live)}</>;

  const status =
    live.status === "online"
      ? "online"
      : live.status === "offline"
        ? "offline"
        : "pending";

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <StatusBadge status={status} />
    </Stack>
  );
}
