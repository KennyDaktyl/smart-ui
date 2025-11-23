// src/pages/user/DevicesPage.tsx
import { useCallback, useEffect, useState } from "react";
import {
  Box,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import { useAuth } from "@/hooks/useAuth";
import { raspberryApi } from "@/api/raspberryApi";
import { RaspberryCard } from "@/components/Devices/RaspberryCard";
import { useRaspberryLive } from "@/hooks/useRaspberryLive"; // 🔹 nowy hook
import { HeartbeatPayload } from "@/types/heartbeat";

export default function DevicesPage() {
  const { token } = useAuth();
  const [raspberries, setRaspberries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleHeartbeat = useCallback((hb: HeartbeatPayload) => {
    setRaspberries(prev =>
      prev.map(rpi =>
        rpi.uuid === hb.uuid
          ? {
              ...rpi,
              is_online: hb.status === "online",
              last_seen: new Date().toISOString(),
              gpio: hb.gpio,
              devices_live: hb.devices,
              free_slots: hb.free_slots,
            }
          : rpi
      )
    );
  }, []);
  
  useRaspberryLive(handleHeartbeat);

  // 🔹 Pierwsze pobranie danych z backendu
  useEffect(() => {
    const load = async () => {
      if (!token) return;
      try {
        const res = await raspberryApi.getMyRaspberries(token);
        setRaspberries(res.data);
      } catch {
        setError("Nie udało się pobrać listy urządzeń.");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3}>
        Moje urządzenia (Raspberry)
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      <Grid container spacing={2}>
        {raspberries.length > 0 ? (
          raspberries.map((rpi) => (
            <Grid key={rpi.uuid} size={{ xs: 12, md: 6, lg: 4 }}>
              <RaspberryCard 
                rpi={rpi} 
                live={rpi.devices_live}
                gpioLive={rpi.gpio}
              />
            </Grid>
          ))
        ) : (
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            Brak zarejestrowanych Raspberry.
          </Typography>
        )}
      </Grid>
    </Box>
  );
}
