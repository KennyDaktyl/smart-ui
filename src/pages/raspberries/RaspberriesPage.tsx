// src/pages/RaspberriesPage.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { Box, Typography, Alert, CircularProgress } from "@mui/material";
import Grid from "@mui/material/Grid2";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { userApi } from "@/api/userApi";

import { HeartbeatPayload } from "@/shared/types/heartbeat";
import { useRaspberryListLive } from "@/features/raspberries/hooks/useRaspberryListLive";

import { RaspberryCard } from "@/features/raspberries/components/RaspberryCard";
import { RaspberryWithDevices } from "@/features/raspberries/types/raspberries";
import { DeviceList } from "@/features/devices/components/DeviceList";


export default function RaspberriesPage() {
  const { token } = useAuth();

  const [items, setItems] = useState<RaspberryWithDevices[]>([]);
  const [availableInverters, setAvailableInverters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const uuids = useMemo(() => {
    if (loading) return [];
    return items.map((i) => i.rpi.uuid);
  }, [loading, items]);

  const handleHeartbeat = useCallback((hb: HeartbeatPayload) => {
    console.log("📡 Heartbeat:", hb);

    setItems((prev) =>
      prev.map((item) =>
        item.rpi.uuid === hb.uuid
          ? {
              ...item,
              liveInitialized: true,
              is_online: hb.status === "online",
              last_seen: hb.sent_at ?? item.last_seen,
              live: hb.status === "online" ? hb.devices ?? [] : [],
            }
          : item
      )
    );
  }, []);

  useRaspberryListLive(uuids, handleHeartbeat);

  const load = async () => {
    if (!token) return;

    try {
      const res = await userApi.getUserInstallations(token);
      const installations = res.data.installations;

      const invs = installations.flatMap((i: any) => i.inverters);
      setAvailableInverters(invs);

      const raspberriesFlat = installations.flatMap((inst: any) =>
        inst.inverters.flatMap((inv: any) =>
          (inv.raspberries ?? []).map((rpi: any) => ({
            ...rpi,
            inverter: inv,
            installation: inst,
          }))
        )
      );

      const merged: RaspberryWithDevices[] = raspberriesFlat.map((rpi: any) => ({
        rpi,
        devices: rpi.devices || [],
        live: [],
        liveInitialized: false,
        is_online: false,
        last_seen: null,
      }));

      setItems(merged);
    } catch (err) {
      console.error("Failed to load raspberries:", err);
      setError("Nie udało się pobrać urządzeń.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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

      <Grid container spacing={3}>
        {items.length > 0 ? (
          items.map((item) => (
            <Grid key={item.rpi.uuid} size={{ xs: 12, md: 6, lg: 4 }}>
              <RaspberryCard
                rpi={item.rpi}
                isOnline={item.is_online}
                lastSeen={item.last_seen}
                liveInitialized={item.liveInitialized}
                availableInverters={availableInverters}
              />

              <DeviceList
                devices={item.devices}
                live={item.live}
                liveInitialized={item.liveInitialized}
                raspberryId={item.rpi.id}
                onRefresh={load}
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
