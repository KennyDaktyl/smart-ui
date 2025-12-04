// src/components/Devices/RaspberryCard.tsx
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
import { raspberryApi } from "@/api/raspberryApi";
import { inverterApi } from "@/api/inverterApi";
import { useInverterLive } from "@/hooks/useInverterLive";

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

  /** ⚡ Moc */
  const [power, setPower] = useState<number | null>(null);
  const [timestamp, setTimestamp] = useState<string | null>(null);
  const [powerError, setPowerError] = useState<string | null>(null);

  /** 🌐 Flagi: czy dostaliśmy WS update? czy dane REST są przeterminowane? */
  const [wsArrived, setWsArrived] = useState(false);
  const [isStale, setIsStale] = useState(false);

  const assignedInverter = availableInverters.find(
    (i) => i.id === rpi.inverter_id
  );

  const serial = assignedInverter?.serial_number;

  /** ----------------------------------------------------------
   * 1️⃣ WebSocket subskrypcja — jeśli przyjdzie update → nie jesteśmy stale
   * --------------------------------------------------------*/
  useInverterLive(serial, (data) => {
    setWsArrived(true); // WS działa → nawet jeśli moc = 0, dane są aktualne
    console.log("📶 Inverter live data:", data);
    if (data.status === "failed") {
      setPower(null);
      setPowerError(data.error_message || "Power unavailable");
    } else {
      setPower(data.active_power);
      setPowerError(null);
    }

    if (data.timestamp) {
      setTimestamp(data.timestamp);
      setIsStale(false); // mamy świeżą dane z WS
    }
  });

  /** ----------------------------------------------------------
   * 2️⃣ Pobierz stan inicjalny z REST
   * --------------------------------------------------------*/
  useEffect(() => {
    const loadInitialPower = async () => {
      if (!token || !assignedInverter) return;

      try {
        const res = await inverterApi.getDeviceProduction(token, assignedInverter.id);

        const restPower = res.data?.active_power ?? null;
        const restTimestamp = res.data?.timestamp ?? null;

        setPower(restPower);
        setTimestamp(restTimestamp);

        // sprawdzamy świeżość danych
        if (restTimestamp) {
          const ageSec =
            (Date.now() - new Date(restTimestamp).getTime()) / 1000;

          if (ageSec > 180) {
            // starsze niż 3 minuty
            setIsStale(true);
          }
        }
      } catch {
        setPowerError("Power unavailable");
      }
    };

    loadInitialPower();
  }, [token, assignedInverter?.id]);

  /** ----------------------------------------------------------
   * 3️⃣ Jeśli WS zacznie działać → wyłącz warning stale
   * --------------------------------------------------------*/
  useEffect(() => {
    if (wsArrived) setIsStale(false);
  }, [wsArrived]);

  /** ----------------------------------------------------------
   * 4️⃣ Przypisywanie inwertera
   * --------------------------------------------------------*/
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

  /** ----------------------------------------------------------
   * Format czasu
   * --------------------------------------------------------*/
  const formattedDateTime =
    timestamp &&
    new Date(timestamp).toLocaleString("pl-PL", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });

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

      {/* ⚡ POWER */}
      {serial && (
        <Box sx={{ mt: 2 }}>
          {powerError ? (
            <Alert severity="error" sx={{ p: 1 }}>
              ❌ {powerError}
            </Alert>
          ) : isStale ? (
            <Alert severity="warning" sx={{ p: 1 }}>
              ⚠️ Dane o mocy mogą być nieaktualne (ostatnia aktualizacja {formattedDateTime})
            </Alert>
          ) : power !== null ? (
            <Alert severity="success" sx={{ p: 1 }}>
              ⚡ Moc inwertera: <strong>{power.toFixed(2)} W</strong>
              {formattedDateTime && (
                <Typography variant="body2" color="text.secondary">
                  🕒 {formattedDateTime}
                </Typography>
              )}
            </Alert>
          ) : (
            <Alert severity="info" sx={{ p: 1 }}>
              🔌 Oczekiwanie na dane…
            </Alert>
          )}
        </Box>
      )}

      {/* Inverter assignment */}
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
