import { Alert, CircularProgress } from "@mui/material";

export function PowerLoadingAlert() {
  return (
    <Alert severity="info" sx={{ display: "flex", gap: 1 }}>
      <CircularProgress size={16} /> Fetching power data…
    </Alert>
  );
}
