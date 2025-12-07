// src/pages/RaspberriesPage.tsx
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Box, Typography, Alert, CircularProgress } from "@mui/material";
import Grid from "@mui/material/Grid2";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { userApi } from "@/api/userApi";
import { useTranslation } from "react-i18next";

import { HeartbeatPayload } from "@/shared/types/heartbeat";
import { useRaspberryListLive } from "@/features/raspberries/hooks/useRaspberryListLive";

import { RaspberryCard } from "@/features/raspberries/components/RaspberryCard";
import { RaspberryWithDevices } from "@/features/raspberries/types/raspberries";
import { DeviceList } from "@/features/devices/components/DeviceList";

const HEARTBEAT_TIMEOUT_MS = 15000; // heartbeats every 5s; mark offline if nothing arrives for 15s
type TimerId = ReturnType<typeof setTimeout>;


export default function RaspberriesPage() {
  const { token } = useAuth();
  const { t } = useTranslation();

  const [items, setItems] = useState<RaspberryWithDevices[]>([]);
  const [availableInverters, setAvailableInverters] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const offlineTimers = useRef<Record<string, TimerId>>({});

  const uuids = useMemo(() => {
    if (loading) return [];
    return items.map((i) => i.rpi.uuid);
  }, [loading, items]);

  const clearOfflineTimer = useCallback((uuid: string) => {
    const timerId = offlineTimers.current[uuid];
    if (timerId) {
      clearTimeout(timerId);
      delete offlineTimers.current[uuid];
    }
  }, []);

  const scheduleOfflineMark = useCallback((uuid: string) => {
    clearOfflineTimer(uuid);
    offlineTimers.current[uuid] = setTimeout(() => {
      setItems((prev) =>
        prev.map((item) =>
          item.rpi.uuid === uuid
            ? {
                ...item,
                liveInitialized: true,
                is_online: false,
                live: [],
              }
            : item
        )
      );
    }, HEARTBEAT_TIMEOUT_MS);
  }, [clearOfflineTimer]);

  const handleHeartbeat = useCallback((hb: HeartbeatPayload) => {
    scheduleOfflineMark(hb.uuid);

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
  }, [scheduleOfflineMark]);

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
      merged.forEach((item) => scheduleOfflineMark(item.rpi.uuid));
    } catch (err) {
      console.error("Failed to load raspberries:", err);
      setError(t("raspberries.fetchError"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [token]);

  useEffect(() => {
    const active = new Set(uuids);
    Object.keys(offlineTimers.current).forEach((uuid) => {
      if (!active.has(uuid)) {
        clearOfflineTimer(uuid);
      }
    });
  }, [uuids, clearOfflineTimer]);

  useEffect(() => {
    return () => {
      Object.values(offlineTimers.current).forEach((timerId) => clearTimeout(timerId));
      offlineTimers.current = {};
    };
  }, []);

  if (loading)
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="80vh">
        <CircularProgress />
      </Box>
    );

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3}>
        {t("raspberries.title")}
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
                isOnline={item.is_online}
                raspberryId={item.rpi.id}
                onRefresh={load}
              />
            </Grid>
          ))
        ) : (
          <Typography color="text.secondary" sx={{ mt: 2 }}>
            {t("raspberries.empty")}
          </Typography>
        )}
      </Grid>
    </Box>
  );
}
