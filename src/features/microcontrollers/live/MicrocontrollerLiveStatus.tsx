import { Stack } from "@mui/material";
import type { ReactNode } from "react";
import { StatusBadge } from "@/features/common/components/atoms/StatusBadge";
import { useMicrocontrollerLive } from "@/features/microcontrollers/hooks/useMicrocontrollerLive";
import type { LiveState } from "@/features/microcontrollers/hooks/useMicrocontrollerLive";

export type MicrocontrollerLiveStatusProps = {
  uuid?: string;
  state?: LiveState;
  children?: (live: LiveState) => ReactNode;
};

export function MicrocontrollerLiveStatus({
  uuid,
  state,
  children,
}: MicrocontrollerLiveStatusProps) {
  const live = state ?? useMicrocontrollerLive(uuid);

  const status = live.status === "online" ? "online" : live.status === "offline" ? "offline" : "pending";

  if (children) return <>{children(live)}</>;

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <StatusBadge status={status} />
    </Stack>
  );
}
