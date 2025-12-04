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

import { useEffect, useState, useRef } from "react";
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

  /** ⭐ WATCHDOG 180 SEKUND */
  const [countdown, setCountdown] = useState(180);
  const [hasWs, setHasWs] = useState(false); // czy WS już przyszło?
  const [stale, setStale] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const assignedInverter = availableInverters.find(
    (i) => i.id === rpi.inverter_id
  );

  const serial = assignedInverter?.serial_number;

  /** ----------------------------------------------------------
   * 1️⃣ Start 180-sekundowego licznika od razu po wejściu
   * --------------------------------------------------------*/
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setCountdown((cur) => {
        if (cur <= 1) {
          // zero → dane przeterminowane
          if (!hasWs) {
            // WS JESZCZE NIE PRZYSZEDŁ
            return 0;
          }

          // WS przyszło kiedyś, ale kolejny update nie dotarł
          setStale(true);
          return 0;
        }
        return cur - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasWs]);

  /** ----------------------------------------------------------
   * 2️⃣ WebSocket update → reset licznika i oznaczenie, że WS działa
   * --------------------------------------------------------*/
  useInverterLive(serial, (data) => {
    setHasWs(true);
    setStale(false);
    setCountdown(180); // restart watchdog’a

    if (data.status === "failed") {
      setPower(null);
      setPowerError(data.error_message || "Power unavailable");
      return;
    }

    setPower(data.active_power);
    setPowerError(null);

    if (data.timestamp) setTimestamp(data.timestamp);
  });

  /** ----------------------------------------------------------
   * 3️⃣ Pierwszy REST load (tylko po to, by czymś wypełnić ekran)
   * --------------------------------------------------------*/
  useEffect(() => {
    const loadInitial = async () => {
      if (!token || !assignedInverter) return;

      try {
        const res = await inverterApi.getDeviceProduction(token, assignedInverter.id);
        setPower(res.data?.active_power ?? null);
        setTimestamp(res.data?.timestamp ?? null);
      } catch {
        setPowerError("Power unavailable");
      }
    };

    loadInitial();
  }, [token, assignedInverter?.id]);

  /** ----------------------------------------------------------
   * Format timestamp
   * --------------------------------------------------------*/
  const formattedDateTime =
    timestamp &&
    new Date(timestamp).toLocaleString("pl-PL", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit",
    });

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
   * RENDER
   * --------------------------------------------------------*/
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

      {/* POWER */}
      {serial && (
        <Box sx={{ mt: 2 }}>
          {powerError ? (
            <Alert severity="error" sx={{ p: 1 }}>
              ❌ {powerError}
            </Alert>
          ) : !hasWs ? (
            <Alert severity="info" sx={{ p: 1, display: "flex", gap: 1 }}>
              <CircularProgress size={16} />
              Czekam na pierwsze dane… ({countdown}s)
            </Alert>
          ) : stale ? (
            <Alert severity="warning" sx={{ p: 1 }}>
              ⚠️ Dane o mocy są nieaktualne!
              {formattedDateTime && (
                <Typography variant="body2" color="text.secondary">
                  ostatnia wartość: {formattedDateTime}
                </Typography>
              )}
            </Alert>
          ) : (
            <Alert severity="success" sx={{ p: 1 }}>
              ⚡ Moc inwertera: <strong>{power?.toFixed(2)} W</strong>
              <Typography variant="body2" color="text.secondary">
                Kolejna oczekiwana aktualizacja za {countdown}s
              </Typography>
              {formattedDateTime && (
                <Typography variant="body2" color="text.secondary">
                  Ostatnia aktualizacja: {formattedDateTime}
                </Typography>
              )}
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
