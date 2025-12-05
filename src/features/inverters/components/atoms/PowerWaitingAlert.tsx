import { Alert, CircularProgress } from "@mui/material";

interface Props {
  countdown: number;
}

export function PowerWaitingAlert({ countdown }: Props) {
  return (
    <Alert severity="info" sx={{ display: "flex", gap: 1 }}>
      <CircularProgress size={16} />
      Waiting for first data… ({countdown}s)
    </Alert>
  );
}
