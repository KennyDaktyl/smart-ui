import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Alert,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import MemoryIcon from "@mui/icons-material/Memory";
import SensorsIcon from "@mui/icons-material/Sensors";
import DeviceHubIcon from "@mui/icons-material/DeviceHub";
import { useTranslation } from "react-i18next";
import { adminApi } from "@/api/adminApi";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { AdminInstallation, AdminInverter, AdminRaspberry, AdminUserDetails } from "@/features/admin/types";
import { useRaspberryListLive } from "@/features/raspberries/hooks/useRaspberryListLive";
import { HeartbeatPayload } from "@/shared/types/heartbeat";
import { InverterPower } from "@/features/inverters/components/InverterPower";

export default function UserDetailsPage() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuth();
  const { t, i18n } = useTranslation();

  const [details, setDetails] = useState<AdminUserDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [raspberryLive, setRaspberryLive] = useState<
    Record<string, { isOnline: boolean; liveInitialized: boolean; lastSeen: string | null }>
  >({});

  const locale = useMemo(() => (i18n.language === "pl" ? "pl-PL" : "en-US"), [i18n.language]);
  const parsedId = userId ? Number(userId) : NaN;
  const offlineTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const HEARTBEAT_TIMEOUT_MS = 15000;

  const raspberryUuids = useMemo(() => {
    if (!details) return [];
    const uuids: string[] = [];
    details.installations.forEach((inst) => {
      inst.inverters?.forEach((inv) => {
        inv.raspberries?.forEach((rpi) => {
          if (rpi.uuid) uuids.push(rpi.uuid);
        });
      });
    });
    return uuids;
  }, [details]);

  const clearOfflineTimer = useCallback((uuid: string) => {
    const timer = offlineTimers.current[uuid];
    if (timer) {
      clearTimeout(timer);
      delete offlineTimers.current[uuid];
    }
  }, []);

  const scheduleOfflineMark = useCallback(
    (uuid: string) => {
      clearOfflineTimer(uuid);
      offlineTimers.current[uuid] = setTimeout(() => {
        setRaspberryLive((prev) => ({
          ...prev,
          [uuid]: { isOnline: false, liveInitialized: true, lastSeen: prev[uuid]?.lastSeen ?? null },
        }));
      }, HEARTBEAT_TIMEOUT_MS);
    },
    [clearOfflineTimer]
  );

  const handleHeartbeat = useCallback(
    (hb: HeartbeatPayload) => {
      if (!hb.uuid) return;
      scheduleOfflineMark(hb.uuid);
      setRaspberryLive((prev) => ({
        ...prev,
        [hb.uuid]: {
          isOnline: hb.status === "online",
          liveInitialized: true,
          lastSeen: hb.sent_at ?? prev[hb.uuid]?.lastSeen ?? null,
        },
      }));
    },
    [scheduleOfflineMark]
  );

  useRaspberryListLive(raspberryUuids, handleHeartbeat);

  useEffect(() => {
    if (!token) return;
    if (!userId || Number.isNaN(parsedId)) {
      setError(t("admin.errors.invalidUserId"));
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const res = await adminApi.getUserDetails(token, parsedId);
        const data = res.data;
        setDetails({
          ...data,
          installations: data.installations || [],
        });
        const initialLive: Record<string, { isOnline: boolean; liveInitialized: boolean; lastSeen: string | null }> = {};
        (data.installations || []).forEach((inst: AdminInstallation) =>
          inst.inverters?.forEach((inv: AdminInverter) =>
            inv.raspberries?.forEach((rpi: AdminRaspberry) => {
              if (rpi.uuid) {
                initialLive[rpi.uuid] = initialLive[rpi.uuid] ?? {
                  isOnline: false,
                  liveInitialized: false,
                  lastSeen: null,
                };
              }
            })
          )
        );
        Object.values(offlineTimers.current).forEach((timerId) => clearTimeout(timerId));
        offlineTimers.current = {};
        setRaspberryLive(initialLive);
        Object.keys(initialLive).forEach((uuid) => scheduleOfflineMark(uuid));
        setError("");
      } catch (err) {
        console.error("Failed to load user details", err);
        setError(t("admin.errors.loadUserDetails"));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token, userId, parsedId, t, scheduleOfflineMark]);

  useEffect(() => {
    const active = new Set(raspberryUuids);
    Object.keys(offlineTimers.current).forEach((uuid) => {
      if (!active.has(uuid)) {
        clearOfflineTimer(uuid);
      }
    });
  }, [raspberryUuids, clearOfflineTimer]);

  useEffect(() => {
    return () => {
      Object.values(offlineTimers.current).forEach((timerId) => clearTimeout(timerId));
      offlineTimers.current = {};
    };
  }, []);

  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" height="70vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !details) {
    return (
      <Box p={{ xs: 1.5, md: 3 }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/admin")}
          sx={{ mb: 2 }}
          variant="outlined"
        >
          {t("admin.backToList")}
        </Button>
        <Alert severity="error">{error || t("admin.errors.loadUserDetails")}</Alert>
      </Box>
    );
  }

  return (
    <Box p={{ xs: 1.5, md: 3 }}>
      <Breadcrumbs sx={{ color: "rgba(232,241,248,0.8)", mb: 1 }}>
        <Button color="inherit" onClick={() => navigate("/dashboard")} size="small">
          {t("admin.breadcrumb.home")}
        </Button>
        <Button color="inherit" onClick={() => navigate("/admin")} size="small">
          {t("admin.breadcrumb.admin")}
        </Button>
        <Typography color="inherit" variant="body2">
          {details.email}
        </Typography>
      </Breadcrumbs>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        gap={2}
        mb={2}
      >
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800, color: "#e8f1f8" }}>
            {t("admin.userDetailsTitle", { email: details.email })}
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(232,241,248,0.7)" }}>
            {t("admin.userDetailsSubtitle")}
          </Typography>
        </Box>

        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate("/admin")}
          variant="outlined"
          sx={{
            borderRadius: 10,
            borderColor: "rgba(15,139,111,0.35)",
            color: "#e8f1f8",
            "&:hover": { borderColor: "primary.main", backgroundColor: "rgba(15,139,111,0.08)" },
          }}
        >
          {t("admin.backToList")}
        </Button>
      </Stack>

      <Card
        sx={{
          mb: 3,
          borderRadius: 3,
          background: "linear-gradient(135deg, rgba(12,30,44,0.92) 0%, rgba(9,24,36,0.9) 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "0 18px 40px rgba(0,0,0,0.28)",
          color: "#e8f1f8",
        }}
      >
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between">
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {details.email}
              </Typography>
              <Typography variant="body2" color="rgba(220,232,242,0.8)">
                {t("admin.userSince", {
                  date: new Date(details.created_at).toLocaleDateString(locale),
                })}
              </Typography>
              <Typography variant="body2" color="rgba(220,232,242,0.8)">
                {t("admin.idLabel")}: {details.id}
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label={t("admin.role", { role: details.role })} color="primary" />
              <Chip
                label={details.is_active ? t("admin.statusActive") : t("admin.statusInactive")}
                color={details.is_active ? "success" : "default"}
                variant={details.is_active ? "filled" : "outlined"}
              />
              <Chip
                label={`${t("admin.huaweiLabel")}: ${details.huawei_username || t("admin.noHuawei")}`}
                variant="outlined"
              />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Box>
        <Stack direction="row" alignItems="center" spacing={1} mb={2}>
          <SensorsIcon color="secondary" />
          <Typography variant="h5" sx={{ color: "#e8f1f8", fontWeight: 700 }}>
            {t("admin.installationsTitle")}
          </Typography>
        </Stack>

        {details.installations.length === 0 ? (
          <Typography color="text.secondary">{t("admin.noInstallationsAdmin")}</Typography>
        ) : (
          <Grid container spacing={2}>
            {details.installations.map((inst: AdminInstallation) => (
              <Grid xs={12} key={inst.id}>
                <Card
                  sx={{
                    borderRadius: 3,
                    background: "linear-gradient(155deg, rgba(12,26,39,0.95) 0%, rgba(11,32,47,0.9) 100%)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "#dce8f2",
                  }}
                >
                  <CardContent>
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      alignItems={{ xs: "flex-start", sm: "center" }}
                      spacing={1.5}
                    >
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700 }}>
                          {inst.name}
                        </Typography>
                        <Typography variant="body2" color="rgba(220,232,242,0.75)">
                          {t("admin.stationCode", { code: inst.station_code })}
                        </Typography>
                        <Typography variant="body2" color="rgba(220,232,242,0.75)">
                          {t("admin.idLabel")}: {inst.id}
                        </Typography>
                        {inst.station_addr && (
                          <Typography variant="body2" color="rgba(220,232,242,0.75)">
                            {t("admin.stationAddress", { address: inst.station_addr })}
                          </Typography>
                        )}
                      </Box>
                      <Chip
                        icon={<MemoryIcon />}
                        label={t("admin.invertersCount", { count: inst.inverters?.length || 0 })}
                        color="primary"
                        variant="outlined"
                      />
                    </Stack>

                    <Divider sx={{ my: 2, borderColor: "rgba(255,255,255,0.12)" }} />

                    {inst.inverters && inst.inverters.length > 0 ? (
                      <Stack spacing={2}>
                        {inst.inverters.map((inv: AdminInverter) => (
                          <Box
                            key={inv.id}
                            sx={{
                              p: 1.5,
                              borderRadius: 2,
                              border: "1px solid rgba(255,255,255,0.08)",
                              background: "rgba(255,255,255,0.04)",
                            }}
                          >
                            <Stack
                              direction={{ xs: "column", md: "row" }}
                              justifyContent="space-between"
                              alignItems={{ xs: "flex-start", md: "center" }}
                              spacing={1}
                            >
                              <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                                  {inv.name || inv.serial_number}
                                </Typography>
                                <Typography variant="body2" color="rgba(220,232,242,0.75)">
                                  {t("admin.serialLabel")}: {inv.serial_number}
                                </Typography>
                                <Typography variant="body2" color="rgba(220,232,242,0.75)">
                                  {t("admin.idLabel")}: {inv.id}
                                </Typography>
                                {inv.model && (
                                  <Typography variant="body2" color="rgba(220,232,242,0.75)">
                                    {inv.model}
                                  </Typography>
                                )}
                              </Box>

                              <Stack direction="row" spacing={1} flexWrap="wrap">
                                {inv.capacity_kw != null && (
                                  <Chip
                                    label={`${inv.capacity_kw} kW`}
                                    size="small"
                                    color="secondary"
                                  />
                                )}
                                <Chip
                                  label={t("admin.inverterUpdated", {
                                    date: new Date(inv.last_updated).toLocaleString(locale),
                                  })}
                                  size="small"
                                  variant="outlined"
                                />
                              </Stack>
                            </Stack>

                            <Box sx={{ mt: 1 }}>
                              <InverterPower inverterId={inv.id} serial={inv.serial_number} />
                            </Box>

                            <Box mt={1.5}>
                              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                                <DeviceHubIcon fontSize="small" color="primary" />
                                <Typography variant="subtitle2">
                                  {t("admin.raspberriesTitle")}
                                </Typography>
                              </Stack>

                              {inv.raspberries && inv.raspberries.length > 0 ? (
                                <Stack spacing={1.2}>
                                  {inv.raspberries.map((rpi: AdminRaspberry) => {
                                    const liveInfo = raspberryLive[rpi.uuid];
                                    return (
                                      <Box
                                        key={rpi.id}
                                        sx={{
                                          p: 1.25,
                                          borderRadius: 2,
                                          border: "1px solid rgba(255,255,255,0.08)",
                                          backgroundColor: "rgba(255,255,255,0.03)",
                                        }}
                                      >
                                        <Stack
                                          direction={{ xs: "column", sm: "row" }}
                                          justifyContent="space-between"
                                          spacing={1}
                                        >
                                          <Box>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>
                                              {rpi.name}
                                            </Typography>
                                            <Stack direction="row" spacing={1} alignItems="center" mb={0.5}>
                                              <Chip
                                                label={liveInfo?.isOnline ? t("common.online") : t("common.offline")}
                                                color={liveInfo?.isOnline ? "success" : "default"}
                                                size="small"
                                                variant={liveInfo?.isOnline ? "filled" : "outlined"}
                                              />
                                              {liveInfo?.lastSeen && (
                                                <Chip
                                                  label={t("raspberries.lastContact", {
                                                    time: new Date(liveInfo.lastSeen).toLocaleTimeString(locale),
                                                  })}
                                                  size="small"
                                                  variant="outlined"
                                                />
                                              )}
                                            </Stack>
                                            <Typography variant="body2" color="rgba(220,232,242,0.78)">
                                              {t("admin.idLabel")}: {rpi.id}
                                            </Typography>
                                            <Typography variant="body2" color="rgba(220,232,242,0.78)">
                                              UUID: {rpi.uuid}
                                            </Typography>
                                            {rpi.description && (
                                              <Typography variant="body2" color="rgba(220,232,242,0.78)">
                                                {rpi.description}
                                              </Typography>
                                            )}
                                          </Box>
                                          <Chip
                                            label={t("admin.devicesCount", {
                                              count: rpi.devices?.length || 0,
                                            })}
                                            size="small"
                                            color="primary"
                                            variant="outlined"
                                          />
                                        </Stack>

                                        <Box mt={1}>
                                          {rpi.devices && rpi.devices.length > 0 ? (
                                            <Grid container spacing={1}>
                                              {rpi.devices.map((dev) => (
                                                <Grid xs={12} sm={6} md={4} key={dev.id}>
                                                  <Box
                                                    sx={{
                                                      p: 1,
                                                      borderRadius: 1.5,
                                                      border: "1px solid rgba(255,255,255,0.08)",
                                                      backgroundColor: "rgba(255,255,255,0.04)",
                                                    }}
                                                  >
                                                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                      {dev.name}
                                                    </Typography>
                                                    <Typography variant="caption" color="rgba(220,232,242,0.75)" display="block">
                                                      {t("admin.idLabel")}: {dev.id}
                                                    </Typography>
                                                    <Typography variant="caption" color="rgba(220,232,242,0.75)" display="block">
                                                      UUID: {dev.uuid}
                                                    </Typography>
                                                    <Typography variant="caption" color="rgba(220,232,242,0.75)" display="block">
                                                      {t("admin.deviceMode", { mode: dev.mode })}
                                                    </Typography>
                                                    <Typography variant="caption" display="block" color="rgba(220,232,242,0.75)">
                                                      {t("admin.devicePower", { power: dev.rated_power_kw ?? "—" })}
                                                    </Typography>
                                                    <Typography variant="caption" display="block" color="rgba(220,232,242,0.75)">
                                                      {t("admin.deviceState", { state: dev.is_on ? t("admin.on") : t("admin.off") })}
                                                    </Typography>
                                                  </Box>
                                                </Grid>
                                              ))}
                                            </Grid>
                                          ) : (
                                            <Typography variant="body2" color="text.secondary">
                                              {t("admin.noDevicesShort")}
                                            </Typography>
                                          )}
                                        </Box>
                                      </Box>
                                    );
                                  })}
                                </Stack>
                              ) : (
                                <Typography variant="body2" color="text.secondary">
                                  {t("admin.noRaspberriesShort")}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                        ))}
                      </Stack>
                    ) : (
                      <Typography color="text.secondary">
                        {t("admin.noInvertersShort")}
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>

    </Box>
  );
}
