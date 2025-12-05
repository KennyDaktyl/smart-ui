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

import { useState } from "react";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { raspberryApi } from "@/api/raspberryApi";

import { InverterPower } from "@/features/inverters/components/InverterPower";

interface RaspberryCardProps {
  rpi: any;
  isOnline: boolean;
  lastSeen?: string | null;
  liveInitialized: boolean;
  availableInverters: any[];
}

export function RaspberryCard({
  rpi,
  isOnline,
  lastSeen,
  liveInitialized,
  availableInverters,
}: RaspberryCardProps) {
  const { token } = useAuth();

  const [selected, setSelected] = useState<number | "">(rpi.inverter_id || "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // 🔥 PRZYPISANY INWERTER
  const assignedInverter = availableInverters.find(
    (i) => i.id === rpi.inverter_id
  );

  const serial = assignedInverter?.serial_number ?? null;
  const inverterId = assignedInverter?.id ?? null;

  // 🔧 Przypisanie inwertera
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
    <Box sx={{ p: 2, borderRadius: 2, border: "1px solid #ddd" }}>
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

      {liveInitialized && lastSeen && (
        <Typography variant="caption" color="text.secondary">
          Ostatni kontakt: {new Date(lastSeen).toLocaleTimeString()}
        </Typography>
      )}

      {/* Raspberry info */}
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

      {/* 🔥 SEKCJA MOCY – UŻYWAMY NASZEGO KOMPONENTU */}
      {serial && inverterId && (
        <InverterPower inverterId={inverterId} serial={serial} />
      )}

      {/* Select inwertera */}
      <FormControl fullWidth size="small" sx={{ mt: 2 }}>
        <InputLabel>Przypisany inwerter</InputLabel>
        <Select
          value={selected}
          label="Przypisany inwerter"
          disabled={loading}
          onChange={(e) => handleAssign(Number(e.target.value))}
        >
          {availableInverters.map((inv) => (
            <MenuItem key={inv.id} value={inv.id}>
              {inv.name || inv.serial_number}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      {/* Snackbar */}
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
