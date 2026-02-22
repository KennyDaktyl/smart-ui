import type { ReactNode } from "react";
import type { LiveState } from "@/features/microcontrollers/hooks/useMicrocontrollerLive";
import { MicrocontrollerLiveWidget } from "@/features/live/widgets/MicrocontrollerLiveWidget";

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
  return (
    <MicrocontrollerLiveWidget uuid={uuid} state={state}>
      {children}
    </MicrocontrollerLiveWidget>
  );
}
