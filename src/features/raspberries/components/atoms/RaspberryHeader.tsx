import { Stack, Typography } from "@mui/material";
import { StatusIndicator } from "@/components/atoms/StatusIndicator";

interface RaspberryHeaderProps {
  name: string;
  isOnline: boolean;
  liveInitialized: boolean;
}

export function RaspberryHeader({ name, isOnline, liveInitialized }: RaspberryHeaderProps) {
  return (
    <Stack direction="row" justifyContent="space-between" alignItems="center">
      <Typography variant="h6">{name}</Typography>

      <StatusIndicator
        loading={!liveInitialized}
        isOnline={isOnline}
      />
    </Stack>
  );
}
