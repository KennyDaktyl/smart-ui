import { Alert, Typography } from "@mui/material";

interface Props {
  power: number;
  timestamp?: string | null;
  countdown: number;
}

export function PowerSuccessAlert({ power, timestamp, countdown }: Props) {
  return (
    <Alert severity="success">
      ⚡ Power: <strong>{power.toFixed(2)} kW</strong>

      <Typography variant="body2">
        Next update in {countdown}s
      </Typography>

      {timestamp && (
        <Typography variant="body2">
          Last update: {timestamp}
        </Typography>
      )}
    </Alert>
  );
}
