import { Stack, Typography, CircularProgress } from "@mui/material";
import CircleIcon from "@mui/icons-material/Circle";

interface StatusIndicatorProps {
  loading: boolean;
  isOnline: boolean;
}

export function StatusIndicator({ loading, isOnline }: StatusIndicatorProps) {
  if (loading) {
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <CircularProgress size={12} />
        <Typography variant="body2" color="text.secondary">
          Waiting for status...
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <CircleIcon
        sx={{
          color: isOnline ? "success.main" : "grey.500",
          fontSize: 14,
        }}
      />
      <Typography variant="body2" color="text.secondary">
        {isOnline ? "Online" : "Offline"}
      </Typography>
    </Stack>
  );
}
