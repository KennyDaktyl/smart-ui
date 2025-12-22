// src/pages/RaspberriesPage.tsx
import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { Box, Typography, Alert, CircularProgress, Stack } from "@mui/material";
import Grid from "@mui/material/Grid2";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { userApi } from "@/api/userApi";
import { useTranslation } from "react-i18next";

import { HeartbeatPayload } from "@/shared/types/heartbeat";
import { useMicrocontrollerListLive } from "@/features/raspberries/hooks/useMicrocontrollerListLive";

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

  useMicrocontrollerListLive(uuids, handleHeartbeat);

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
    <Box p={{ xs: 1.5, md: 3 }}>
      <Typography variant="h4" mb={3}>
        {t("raspberries.title")}
      </Typography>

      {error && <Alert severity="error">{error}</Alert>}

      <Grid container spacing={3}>
        {items.length > 0 ? (
          items.map((item) => (
            <Grid key={item.rpi.uuid} size={{ xs: 12, md: 6, lg: 4 }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: "column",
                  gap: { xs: 1.25, md: 2 },
                  borderRadius: 3,
                  border: {
                    xs: "1px solid rgba(255,255,255,0.07)",
                    md: "1px solid rgba(255,255,255,0.06)",
                  },
                  background: {
                    xs: "linear-gradient(140deg, rgba(8,19,31,0.94) 0%, rgba(7,30,42,0.92) 50%, rgba(10,45,59,0.9) 100%)",
                    md: "linear-gradient(145deg, #0b1828 0%, #0d2233 40%, #0b1828 100%)",
                  },
                  boxShadow: {
                    xs: "0 14px 32px rgba(0,0,0,0.45)",
                    md: "0 24px 48px rgba(0,0,0,0.3)",
                  },
                  p: { xs: 1.25, md: 1.5 },
                  color: "#e2f2ec",
                }}
              >
                <Box
                  sx={{
                    background: {
                      xs: "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, #f8fbf9 100%)",
                      md: "linear-gradient(135deg, rgba(255,255,255,0.98) 0%, #f8fbf9 100%)",
                    },
                    borderRadius: 2,
                    boxShadow: {
                      xs: "0 12px 26px rgba(0,0,0,0.25)",
                      md: "0 14px 30px rgba(0,0,0,0.22)",
                    },
                    border: { xs: "1px solid rgba(15,139,111,0.12)", md: "none" },
                  }}
                >
                  <RaspberryCard
                    rpi={item.rpi}
                    isOnline={item.is_online}
                    lastSeen={item.last_seen}
                    liveInitialized={item.liveInitialized}
                    availableInverters={availableInverters}
                  />
                </Box>

                <Box
                  sx={{
                    mt: { xs: 0.25, md: 0 },
                    p: { xs: 1.25, md: 2 },
                    borderRadius: 2,
                    border: {
                      xs: "1px solid rgba(255,255,255,0.08)",
                      md: "1px dashed rgba(255,255,255,0.12)",
                    },
                    background: {
                      xs: "linear-gradient(180deg, rgba(6,17,26,0.88) 0%, rgba(6,20,30,0.92) 100%)",
                      md: "linear-gradient(160deg, rgba(7,19,29,0.9) 0%, rgba(8,24,35,0.92) 70%, rgba(8,24,35,0.96) 100%)",
                    },
                    boxShadow: {
                      xs: "0 10px 22px rgba(0,0,0,0.35)",
                      md: "0 16px 30px rgba(0,0,0,0.22)",
                    },
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="center"
                    mb={1.5}
                    spacing={1}
                  >
                    <Typography variant="subtitle1" sx={{ color: "#e2f2ec" }}>
                      {t("devices.sectionTitle", { name: item.rpi.name })}
                    </Typography>
                  </Stack>

                  <DeviceList
                    devices={item.devices}
                    live={item.live}
                    liveInitialized={item.liveInitialized}
                    isOnline={item.is_online}
                    raspberryId={item.rpi.id}
                    raspberryUuid={item.rpi.uuid}
                    raspberryName={item.rpi.name}
                    onRefresh={load}
                  />
                </Box>
              </Box>
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
