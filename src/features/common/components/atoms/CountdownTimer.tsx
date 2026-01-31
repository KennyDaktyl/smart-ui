import { Typography } from "@mui/material";

export type CountdownTimerProps = {
  seconds: number | null;
};

export function CountdownTimer({ seconds }: CountdownTimerProps) {
  const label = seconds == null ? "--" : `${seconds}s`;

  return (
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
  );
}
