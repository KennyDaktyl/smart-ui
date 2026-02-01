import { Stack } from "@mui/material";
import { StatusBadge } from "@/features/common/components/atoms/StatusBadge";

export type DeviceLiveStatusProps = {
  loading?: boolean;
  isOnline: boolean;
};

export function DeviceLiveStatus({ loading, isOnline }: DeviceLiveStatusProps) {
  if (loading) {
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <StatusBadge status="pending" />
      </Stack>
    );
  }

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <StatusBadge status={isOnline ? "online" : "offline"} />
    </Stack>
  );
}
