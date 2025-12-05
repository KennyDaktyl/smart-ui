import { Alert, Typography } from "@mui/material";

interface Props {
  timestamp?: string | null;
}

export function PowerStaleAlert({ timestamp }: Props) {
  return (
    <Alert severity="warning">
      ⚠️ Power data is outdated!
      {timestamp && (
        <Typography variant="body2">Last known value: {timestamp}</Typography>
      )}
    </Alert>
  );
}
