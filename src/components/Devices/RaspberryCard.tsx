import {
  Box,
  Typography,
  Stack,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";

import CircleIcon from "@mui/icons-material/Circle";
import MemoryIcon from "@mui/icons-material/Memory";
import DeviceHubIcon from "@mui/icons-material/DeviceHub";
import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { userApi } from "@/api/userApi";
import { raspberryApi } from "@/api/raspberryApi";

interface RaspberryCardProps {
  rpi: any;
  isOnline: boolean;
  lastSeen?: string | null;
  liveInitialized: boolean;
}

export function RaspberryCard({
  rpi,
  isOnline,
  lastSeen,
  liveInitialized,
}: RaspberryCardProps) {
  const { token } = useAuth();

  const [availableInverters, setAvailableInverters] = useState<any[]>([]);
  const [selected, setSelected] = useState<number | "">(rpi.inverter_id || "");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const loadInv = async () => {
      if (!token) return;
      setFetching(true);

      try {
        const res = await userApi.getUserInstallations(token);
        const invs = res.data.installations.flatMap((i: any) => i.inverters);
        setAvailableInverters(invs);
      } finally {
        setFetching(false);
      }
    };

    loadInv();
  }, [token]);

  const handleAssign = async (invId: number) => {
    if (!token) return;

    setLoading(true);
    try {
      await raspberryApi.updateRaspberry(token, rpi.uuid, {
        inverter_id: invId,
      });
      setSelected(invId);
      setSuccess(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      {/* Header */}
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h6">{rpi.name}</Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          {!liveInitialized ? (
            <>
              <CircularProgress size={12} />
              <Typography variant="body2" color="text.secondary">
                Oczekiwanie na status…
              </Typography>
            </>
          ) : (
            <>
              <CircleIcon
                sx={{
                  color: isOnline ? "success.main" : "grey.500",
                  fontSize: 14,
                }}
              />
              <Typography variant="body2" color="text.secondary">
                {isOnline ? "Online" : "Offline"}
              </Typography>
            </>
          )}
        </Stack>
      </Stack>

      {/* Last seen */}
      {liveInitialized && lastSeen && (
        <Typography variant="caption" color="text.secondary">
          Ostatni kontakt: {new Date(lastSeen).toLocaleTimeString()}
        </Typography>
      )}

      {/* Info row */}
      <Stack direction="row" spacing={3} mt={2} alignItems="center">
        <Stack direction="row" spacing={1} alignItems="center">
          <MemoryIcon sx={{ color: "primary.main" }} />
          <Typography variant="body2">
            Soft: {rpi.software_version || "n/d"}
          </Typography>
        </Stack>

        <Stack direction="row" spacing={1} alignItems="center">
          <DeviceHubIcon sx={{ color: "primary.main" }} />
          <Typography variant="body2">Max urządzeń: {rpi.max_devices}</Typography>
        </Stack>
      </Stack>

      {/* Inverter assignment */}
      <FormControl fullWidth size="small" sx={{ mt: 2 }}>
        <InputLabel>Przypisany inwerter</InputLabel>
        <Select
          value={selected}
          label="Przypisany inwerter"
          disabled={loading || fetching}
          onChange={(e) => handleAssign(Number(e.target.value))}
        >
          {availableInverters.map((inv) => (
            <MenuItem key={inv.id} value={inv.id}>
              {inv.name || inv.serial_number}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Snackbar
        open={success}
        autoHideDuration={2500}
        onClose={() => setSuccess(false)}
      >
        <Alert severity="success" onClose={() => setSuccess(false)}>
          Inwerter przypisany!
        </Alert>
      </Snackbar>
    </Box>
  );
}
