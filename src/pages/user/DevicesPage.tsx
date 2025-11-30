// src/pages/DevicesPage.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Typography, Alert, CircularProgress } from "@mui/material";
import Grid from "@mui/material/Grid2";

import { useAuth } from "@/hooks/useAuth";
import { raspberryApi } from "@/api/raspberryApi";
import { deviceApi } from "@/api/deviceApi";

import { useRaspberryLive } from "@/hooks/useRaspberryLive";
import { HeartbeatPayload } from "@/types/heartbeat";

import { RaspberryCard } from "@/components/Devices/RaspberryCard";
import { DeviceList } from "@/components/Devices/DeviceList";

interface RaspberryWithDevices {
  rpi: any;
  devices: any[];
  live: any[];
  liveInitialized: boolean;
  is_online: boolean;
  last_seen?: string | null;
}

export default function DevicesPage() {
  const { token } = useAuth();

  const [items, setItems] = useState<RaspberryWithDevices[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /** wyciągamy tylko uuid dla WebSocket */
  const uuids = useMemo(() => items.map((i) => i.rpi.uuid), [items]);

  /* -----------------------------------------------------
   * 1️⃣ Obsługa heartbeat — tylko statusy live!
   * ----------------------------------------------------- */
  const handleHeartbeat = useCallback((hb: HeartbeatPayload) => {
    setItems((prev) =>
      prev.map((item) =>
        item.rpi.uuid === hb.uuid
          ? {
              ...item,
              liveInitialized: true,
              is_online: hb.status === "online",
              last_seen: hb.sent_at ?? item.last_seen,

              // statusy live urządzeń
              live: hb.status === "online" ? hb.devices || [] : [],
            }
          : item
      )
    );
  }, []);

  useRaspberryLive(uuids, handleHeartbeat);

  /* -----------------------------------------------------
   * 2️⃣ Ładowanie Raspberry → a potem urządzeń
   * ----------------------------------------------------- */
  const load = async () => {
    if (!token) return;
    try {
      const res = await raspberryApi.getMyRaspberries(token);

      const raspberries = res.data;

      // równoległe pobrania devices dla każdego rpi
      const deviceRequests = raspberries.map((r: any) =>
        deviceApi.getRaspberryDevices(token, r.id)
      );

      const responses = await Promise.all(deviceRequests);

      const merged: RaspberryWithDevices[] = raspberries.map(
        (rpi: any, index: number) => ({
          rpi,
          devices: responses[index].data,
          live: [], // heartbeat dopiero przyjdzie
          liveInitialized: false,
          is_online: false,
          last_seen: null,
        })
      );

      setItems(merged);
    } catch (err) {
      console.error("❌ Failed to load raspberries:", err);
      setError("Nie udało się pobrać urządzeń.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  /* -----------------------------------------------------
   * 3️⃣ EKRAN ŁADOWANIA
   * ----------------------------------------------------- */
  if (loading)
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="80vh"
      >
        <CircularProgress />
      </Box>
    );

  /* -----------------------------------------------------
   * 4️⃣ RENDER
   * ----------------------------------------------------- */
  return (
    <Box p={3}>
      <Typography variant="h4" mb={3}>
        Moje urządzenia (Raspberry)
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      <Grid container spacing={3}>
        {items.length > 0 ? (
          items.map((item) => (
            <Grid key={item.rpi.uuid} size={{ xs: 12, md: 6, lg: 4 }}>
              {/* 👍 RaspberryCard pokazuje tylko info o RPi */}
              <RaspberryCard
                rpi={item.rpi}
                isOnline={item.is_online}
                lastSeen={item.last_seen}
                liveInitialized={item.liveInitialized}
              />

              {/* 👍 osobna lista urządzeń */}
              <DeviceList
                devices={item.devices}
                live={item.live}
                liveInitialized={item.liveInitialized}
                raspberryId={item.rpi.id}
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
