// src/components/Devices/RaspberryCard.tsx
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  Typography,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Box,
  CircularProgress,
  Snackbar,
  Alert,
  Divider,
  Stack,
} from "@mui/material";

import CircleIcon from "@mui/icons-material/Circle";
import { useAuth } from "@/hooks/useAuth";
import { raspberryApi } from "@/api/raspberryApi";
import { userApi } from "@/api/userApi";
import { deviceApi } from "@/api/deviceApi";
import { DeviceSlot } from "./DeviceSlot";

interface RaspberryCardProps {
  rpi: any;
  live?: any[];
  gpioLive?: any;
  onUpdated?: () => void;
}

export function RaspberryCard({ rpi, live, gpioLive, onUpdated }: RaspberryCardProps) {
  const { token } = useAuth();

  const [availableInverters, setAvailableInverters] = useState<any[]>([]);
  const [selected, setSelected] = useState<number | "">(rpi.inverter_id || "");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [success, setSuccess] = useState(false);

  const [devices, setDevices] = useState<any[]>([]);
  const [loadingDevices, setLoadingDevices] = useState(true);

  // 👉 lokalne stany zamiast mutować props!!!
  const [isOnline, setIsOnline] = useState(rpi.is_online);
  const [lastSeen, setLastSeen] = useState(rpi.last_seen);

  // --------------------------- LOAD INVERTERS ---------------------------
  useEffect(() => {
    const fetchInverters = async () => {
      if (!token) return;
      setFetching(true);
      try {
        const res = await userApi.getUserInstallations(token);
        const installations = res.data.installations || [];
        const inverters = installations.flatMap((i: any) => i.inverters || []);
        setAvailableInverters(inverters);
      } catch (err) {
        console.error("⚠️ Błąd pobierania inwerterów", err);
      } finally {
        setFetching(false);
      }
    };
    fetchInverters();
  }, [token]);

  // --------------------------- LOAD DEVICES ---------------------------
  const loadDevices = async () => {
    if (!token) return;
    try {
      const res = await deviceApi.getRaspberryDevices(token, rpi.id);
      setDevices(res.data);
    } catch {
      setDevices([]);
    } finally {
      setLoadingDevices(false);
    }
  };

  useEffect(() => {
    loadDevices();
  }, [rpi.id, token]);

  // --------------------------- ONLINE STATUS ---------------------------
  useEffect(() => {
    if (!gpioLive && !live) return;

    setIsOnline(true);
    setLastSeen(new Date().toISOString());
  }, [gpioLive, live]);

  // --------------------------- LIVE UPDATE DEVICES ---------------------------
  useEffect(() => {
    if (!live || live.length === 0) return;

    setDevices((prev) =>
      prev.map((dev) => {
        const l = live.find((d: any) => Number(d.device_id) === dev.id);
        if (!l) return dev;

        return {
          ...dev,
          is_on: l.is_on,
          online: true,
          live_pin: l.pin,
        };
      })
    );
  }, [live]);

  // --------------------------- ASSIGN INVERTER ---------------------------
  const handleAssign = async (invId: number) => {
    if (!token) return;
    setLoading(true);
    try {
      await raspberryApi.updateRaspberry(token, rpi.uuid, { inverter_id: invId });
      setSelected(invId);
      setSuccess(true);
      onUpdated?.();
    } catch (err) {
      console.error("❌ Nie udało się przypisać inwertera:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card sx={{ height: "100%", p: 1 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1}>
          {rpi.name}
          <CircleIcon
            sx={{
              color: isOnline ? "success.main" : "grey",
              fontSize: 14,
            }}
          />
        </Typography>

        <Typography variant="body2" color="text.secondary">
          {isOnline ? "Online" : "Offline"}
        </Typography>

        {lastSeen && (
          <Typography variant="caption" color="text.secondary">
            ostatni kontakt: {new Date(lastSeen).toLocaleTimeString()}
          </Typography>
        )}

        {rpi.description && (
          <Typography color="text.secondary" gutterBottom>
            {rpi.description || "Brak opisu"}
          </Typography>
        )}

        <Typography variant="body2">Firmware: {rpi.firmware_version || "n/d"}</Typography>
        <Typography variant="body2">Maks. urządzeń: {rpi.max_devices ?? "n/d"}</Typography>
        <Typography variant="body2" gutterBottom>
          GPIO: {rpi.gpio_pins?.join(", ") || "—"}
        </Typography>

        {/* --- ASSIGN INVERTER --- */}
        <Box mt={2}>
          <FormControl fullWidth size="small">
            <InputLabel>Przypisany inwerter</InputLabel>
            <Select
              value={selected}
              onChange={(e) => handleAssign(Number(e.target.value))}
              label="Przypisany inwerter"
              disabled={loading || fetching}
            >
              {availableInverters.map((inv) => (
                <MenuItem key={inv.id} value={inv.id}>
                  {inv.name || inv.serial_number}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        <Divider sx={{ my: 2 }} />

        {/* --- DEVICES LIST --- */}
        <Typography variant="subtitle1" gutterBottom>
          Podłączone urządzenia:
        </Typography>

        {loadingDevices ? (
          <Box textAlign="center" py={2}>
            <CircularProgress size={22} />
          </Box>
        ) : (
          <Stack direction="column" spacing={2}>
            {Array.from({ length: rpi.max_devices }).map((_, idx) => (
              <DeviceSlot
                key={idx}
                raspberryId={rpi.id}
                device={devices[idx]}
                onSaved={loadDevices}
              />
            ))}
          </Stack>
        )}

        <Snackbar
          open={success}
          autoHideDuration={2500}
          onClose={() => setSuccess(false)}
          anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        >
          <Alert severity="success" onClose={() => setSuccess(false)}>
            Raspberry przypisano do inwertera!
          </Alert>
        </Snackbar>
      </CardContent>
    </Card>
  );
}
