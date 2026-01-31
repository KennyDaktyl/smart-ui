import { Card, CardContent, Typography, Stack } from "@mui/material";
import { MicrocontrollerResponse } from "@/features/microcontrollers/types/microcontroller";
import { MicrocontrollerLiveStatus } from "@/features/microcontrollers/live/MicrocontrollerLiveStatus";
import type { LiveState } from "@/features/microcontrollers/hooks/useMicrocontrollerLive";

type Props = {
  microcontroller: MicrocontrollerResponse;
  isOnline: boolean;
  lastSeen: string | null;
  liveInitialized: boolean;
  liveState?: LiveState;
};

export function MicrocontrollerCard({
  microcontroller,
  isOnline,
  lastSeen,
  liveInitialized,
  liveState,
}: Props) {
  const derivedState: LiveState = liveState ?? {
    lastSeen,
    status: liveInitialized ? (isOnline ? "online" : "offline") : "pending",
  };

  const displayLastSeen = derivedState.lastSeen;
  const showLastSeen = derivedState.status !== "pending" && Boolean(displayLastSeen);

  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1}>
          <Typography variant="h6">
            {microcontroller.name}
          </Typography>

          <Typography variant="body2" color="text.secondary">
            Type: {microcontroller.type}
          </Typography>

          <MicrocontrollerLiveStatus
            uuid={microcontroller.uuid}
            state={derivedState}
          />

          {showLastSeen && (
            <Typography variant="caption" color="text.secondary">
              Last seen: {new Date(displayLastSeen!).toLocaleString()}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
