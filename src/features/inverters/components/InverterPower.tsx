import { Box, Alert, Typography, CircularProgress } from "@mui/material";
import { useInverterPower } from "../hooks/useInverterPower";

interface Props {
  inverterId: number;
  serial: string;
}

export function InverterPower({ inverterId, serial }: Props) {
  const {
    power,
    timestamp,
    error,
    hasWs,
    stale,
    countdown,
    loadingInitial,
  } = useInverterPower({
    inverterId,
    serial,
  });

  const formatted =
    timestamp &&
    new Date(timestamp).toLocaleString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit",
    });

  return (
    <Box mt={2}>
      {error ? (
  
        <Alert severity="error">❌ {error}</Alert>
  
      ) : loadingInitial ? (
  
        <Alert severity="info" sx={{ display:"flex", gap:1 }}>
          <CircularProgress size={16} /> Pobieram dane…
        </Alert>
  
      ) : stale ? (
  
        <Alert severity="warning">
          ⚠️ Dane o mocy są nieaktualne!
          {formatted && (
            <Typography variant="body2">ostatnia wartość: {formatted}</Typography>
          )}
        </Alert>
  
      ) : !hasWs && power == null ? (
  
        <Alert severity="info" sx={{ display:"flex", gap:1 }}>
          <CircularProgress size={16} />
          Czekam na pierwsze dane… ({countdown}s)
        </Alert>
  
      ) : (
  
        <Alert severity="success">
          ⚡ Moc: <strong>{(power ?? 0).toFixed(2)} W</strong>
          <Typography variant="body2">
            kolejna aktualizacja za {countdown}s
          </Typography>
          {formatted && (
            <Typography variant="body2">
              Ostatnia aktualizacja: {formatted}
            </Typography>
          )}
        </Alert>
  
      )}
    </Box>
  );
}
