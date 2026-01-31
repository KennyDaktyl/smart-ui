import { Card, CardContent, Typography, Chip, Stack } from "@mui/material";
import { MicrocontrollerResponse } from "@/features/microcontrollers/types/microcontroller";

type Props = {
  microcontroller: MicrocontrollerResponse;
  isOnline: boolean;
  lastSeen: string | null;
  liveInitialized: boolean;
};

export function MicrocontrollerCard({
  microcontroller,
  isOnline,
  lastSeen,
  liveInitialized,
}: Props) {
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

          <Chip
            size="small"
            label={isOnline ? "ONLINE" : "OFFLINE"}
            color={isOnline ? "success" : "default"}
          />

          {liveInitialized && lastSeen && (
            <Typography variant="caption" color="text.secondary">
              Last seen: {new Date(lastSeen).toLocaleString()}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
