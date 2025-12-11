import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Stack, Tab, Tabs, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DnsIcon from "@mui/icons-material/Dns";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { deviceApi } from "@/api/deviceApi";
import { DeviceTelemetryTimeline } from "@/features/devices/components/DeviceTelemetryTimeline";
import { useDeviceEvents } from "@/features/devices/hooks/useDeviceEvents";
import { useRaspberryLive } from "@/features/raspberries/hooks/useRaspberryLive";
import { HeartbeatPayload } from "@/shared/types/heartbeat";
import { raspberryApi } from "@/api/raspberryApi";
import { DeviceDetailsInfo } from "@/features/devices/components/DeviceDetailsInfo";
import { DateRangeFields } from "@/features/common/components/DateRangeFields";
import { MetaBadgeRow } from "@/features/common/components/MetaBadgeRow";
import { DeviceInfoTile } from "@/features/devices/components/DeviceInfoTile";

type DeviceLocationState = {
  device?: any;
  raspberryName?: string;
  raspberryId?: number;
  raspberryUuid?: string;
};

export default function DeviceDetailsPage() {
  const navigate = useNavigate();
  const { id, raspberryId } = useParams<{ id: string; raspberryId: string }>();
  const location = useLocation();
  const { token } = useAuth();
  const { t, i18n } = useTranslation();

  const locationState = (location.state as DeviceLocationState | undefined) || {};

  const [device, setDevice] = useState<any | null>(locationState.device ?? null);
  const [raspberryName, setRaspberryName] = useState<string>(locationState.raspberryName ?? "");
  const [raspberryUuid, setRaspberryUuid] = useState<string>(locationState.raspberryUuid ?? "");
  const [liveOnline, setLiveOnline] = useState<boolean | null>(
    locationState.device?.waitingForState === false ? locationState.device?.online ?? null : null
  );
  const [liveInitialized, setLiveInitialized] = useState<boolean>(
    locationState.device?.waitingForState === false
  );
  const [tab, setTab] = useState("details");
  const [loading, setLoading] = useState(!locationState.device);
  const [error, setError] = useState<string | null>(null);
  const offlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const HEARTBEAT_TIMEOUT_MS = 15000;

  const formatLocalDateTime = (date: Date) => {
    const pad = (value: number) => String(value).padStart(2, "0");
    return [
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
      `${pad(date.getHours())}:${pad(date.getMinutes())}`,
    ].join("T");
  };

  const today = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return {
      start: formatLocalDateTime(start),
      end: formatLocalDateTime(now),
    };
  }, []);
  const [range, setRange] = useState<{ start: string; end: string }>({ start: today.start, end: today.end });

  const { events, summary, loading: loadingEvents, error: eventsError } = useDeviceEvents({
    token,
    deviceId: id ? Number(id) : null,
    rangeStart: range.start,
    rangeEnd: range.end,
    enabled: tab === "telemetry",
    errorMessage: t("devices.details.eventsError"),
  });

  const locale = i18n.language === "pl" ? "pl-PL" : "en-US";

  useEffect(() => {
    if (!token || locationState.device || !id) return;

    const fetchDevice = async () => {
      setLoading(true);
      try {
        const res = await deviceApi.getDeviceById(token, Number(id));
        setDevice(res.data);
        setRaspberryName(res.data?.raspberry_name ?? "");
        setRaspberryUuid(res.data?.raspberry_uuid ?? res.data?.raspberry?.uuid ?? "");
      } catch {
        setError(t("devices.details.loadError"));
      } finally {
        setLoading(false);
      }
    };

    fetchDevice();
  }, [token, locationState.device, id, t]);

  useEffect(() => {
    if (!token || raspberryUuid || !device?.raspberry_id) return;

    const fetchRaspberryUuid = async () => {
      try {
        const res = await raspberryApi.getMyRaspberries(token);
        const raspberries = res.data?.raspberries ?? res.data ?? [];
        const found = Array.isArray(raspberries)
          ? raspberries.find((item: any) => Number(item.id) === Number(device.raspberry_id))
          : null;

        if (found) {
          setRaspberryUuid(found.uuid ?? "");
          if (!raspberryName && found.name) {
            setRaspberryName(found.name);
          }
        }
      } catch (err) {
        console.error("Failed to resolve raspberry uuid", err);
      }
    };

    fetchRaspberryUuid();
  }, [token, raspberryUuid, device?.raspberry_id, raspberryName]);

  const markOffline = useCallback(() => {
    setLiveInitialized(true);
    setLiveOnline(false);
    setDevice((prev: typeof device) => (prev ? { ...prev, online: false } : prev));
  }, []);

  const scheduleOfflineMark = useCallback(() => {
    if (offlineTimerRef.current) {
      clearTimeout(offlineTimerRef.current);
    }

    offlineTimerRef.current = setTimeout(markOffline, HEARTBEAT_TIMEOUT_MS);
  }, [markOffline]);

  const handleHeartbeat = useCallback(
    (hb: HeartbeatPayload) => {
      const targetId = id ? Number(id) : device?.id ?? null;
      const liveDevice = hb.devices?.find((d) => targetId !== null && Number(d.device_id) === Number(targetId));
      const isOnline = hb.status === "online" && !!liveDevice;

      scheduleOfflineMark();
      setLiveInitialized(true);
      setLiveOnline(isOnline);
      setDevice((prev: typeof device) => {
        if (!prev) return prev;

        const matched = liveDevice ?? hb.devices?.find((d) => Number(d.device_id) === Number(prev.id));
        return {
          ...prev,
          online: isOnline,
          is_on: matched?.is_on ?? prev.is_on,
          last_update: hb.sent_at ?? prev.last_update,
        };
      });
    },
    [device?.id, id, scheduleOfflineMark]
  );

  useRaspberryLive(raspberryUuid, handleHeartbeat);

  useEffect(() => {
    if (raspberryUuid) {
      scheduleOfflineMark();
    }

    return () => {
      if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
    };
  }, [raspberryUuid, scheduleOfflineMark]);

  const formattedLastUpdate = useMemo(() => {
    if (!device?.last_update) return t("common.notAvailable");
    return new Date(device.last_update).toLocaleString(locale, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      day: "2-digit",
      month: "2-digit",
    });
  }, [device?.last_update, locale, t]);

  const modeLabel = useMemo(() => {
    if (!device?.mode) return t("common.notAvailable");
    if (device.mode === "AUTO_POWER") return t("devices.form.modes.autoPower");
    if (device.mode === "SCHEDULE") return t("devices.form.modes.schedule");
    return t("devices.form.modes.manual");
  }, [device?.mode, t]);

  const isOnline = liveInitialized ? !!liveOnline : !!device?.online;
  const stateLabel = device?.is_on ? t("devices.details.stateOn") : t("devices.details.stateOff");
  const onlineLabel = isOnline ? t("common.online") : t("common.offline");

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="70vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!device) {
    return (
      <Box p={3}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate(-1)}
          sx={{ mb: 2, textTransform: "none" }}
        >
          {t("devices.details.back")}
        </Button>

        <Alert severity="error">{error || t("devices.details.missing")}</Alert>
      </Box>
    );
  }

  return (
    <Box p={{ xs: 1.5, sm: 3 }}>
      <Button
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate(-1)}
        sx={{ mb: 2, textTransform: "none" }}
      >
        {t("devices.details.back")}
      </Button>

      <Box
        sx={{
          borderRadius: 3,
          background: "linear-gradient(145deg, #0b1828 0%, #0f8b6f 120%)",
          color: "#e2f2ec",
          boxShadow: "0 24px 48px rgba(0,0,0,0.35)",
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "flex-start" }}
            spacing={2}
            rowGap={1}
          >
            <Box>
              <MetaBadgeRow
                caption={t("devices.details.breadcrumb", {
                  raspberryId: raspberryId || device.raspberry_id || "?",
                  device: device.name,
                })}
                badgeLabel={
                  raspberryName
                    ? t("devices.details.raspberryLabel", { name: raspberryName })
                    : t("devices.details.raspberryFallback")
                }
                IconComponent={DnsIcon}
              />
              <Typography variant="h5" fontWeight={700}>
                {device.name}
              </Typography>
              <Typography variant="body2" sx={{ color: "rgba(226,242,236,0.8)" }}>
                {device.uuid
                  ? t("devices.details.uuid", { uuid: device.uuid })
                  : t("devices.details.subtitle", { id })}
              </Typography>
            </Box>

            <Stack
              direction="row"
              spacing={1}
              flexWrap="wrap"
              justifyContent={{ xs: "flex-start", sm: "flex-end" }}
              alignItems="center"
              sx={{ alignSelf: { xs: "flex-start", sm: "center" }, gap: 1 }}
            >
              <Chip
                label={modeLabel}
                sx={{
                  bgcolor: "rgba(226,242,236,0.14)",
                  color: "#e2f2ec",
                  borderColor: "rgba(226,242,236,0.4)",
                  borderWidth: 1,
                }}
                variant="outlined"
              />
              <Chip
                label={onlineLabel}
                color={device.online ? "success" : "default"}
                variant="filled"
              />
            </Stack>
          </Stack>

          <Tabs
            value={tab}
            onChange={(_, value) => setTab(value)}
            sx={{
              mt: 2,
              "& .MuiTab-root": {
                color: "rgba(226,242,236,0.7)",
                cursor: "pointer",
              },
              "& .Mui-selected": { color: "#e2f2ec" },
              "& .MuiTabs-indicator": { backgroundColor: "#e2f2ec" },
            }}
          >
            <Tab value="details" label={t("devices.details.tabs.details")} />
            <Tab value="telemetry" label={t("devices.details.tabs.telemetry")} />
          </Tabs>
        </Box>

        <Box
          sx={{
            background: "#f6fbf8",
            p: { xs: 2, md: 3 },
            borderTop: "1px solid rgba(226,242,236,0.25)",
          }}
        >
          {tab === "details" && (
            <DeviceDetailsInfo
              device={device}
              modeLabel={modeLabel}
              stateLabel={stateLabel}
              onlineLabel={onlineLabel}
              formattedLastUpdate={formattedLastUpdate}
              t={t}
            />
          )}
          {tab === "telemetry" && (
            <Stack spacing={2}>
              <DateRangeFields
                startLabel={t("devices.details.rangeStart")}
                endLabel={t("devices.details.rangeEnd")}
                startValue={range.start}
                endValue={range.end}
                onChangeStart={(value) => setRange((prev) => ({ ...prev, start: value }))}
                onChangeEnd={(value) => setRange((prev) => ({ ...prev, end: value }))}
              />

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <DeviceInfoTile
                  label={t("devices.details.fields.energy")}
                  value={
                    summary.energy_kwh != null
                      ? `${summary.energy_kwh.toFixed(2)} kWh`
                      : t("common.notAvailable")
                  }
                />
                <DeviceInfoTile
                  label={t("devices.details.fields.totalMinutes")}
                  value={
                    summary.total_minutes_on != null
                      ? `${summary.total_minutes_on} min`
                      : t("common.notAvailable")
                  }
                />
                <DeviceInfoTile
                  label={t("devices.details.fields.ratedPower")}
                  value={
                    summary.rated_power_kw != null
                      ? `${summary.rated_power_kw} kW`
                      : t("common.notAvailable")
                  }
                />
                {device.mode === "AUTO_POWER" && (
                  <DeviceInfoTile
                    label={t("devices.details.fields.threshold")}
                    value={
                      device.threshold_kw != null ? `${device.threshold_kw} kW` : t("common.notAvailable")
                    }
                  />
                )}
              </Stack>

              {eventsError && <Alert severity="error">{eventsError}</Alert>}

              <DeviceTelemetryTimeline
                events={events}
                loading={loadingEvents}
                error={eventsError}
                tNoData={t("devices.details.noEvents")}
                start={range.start}
                end={range.end}
              />
            </Stack>
          )}
        </Box>
      </Box>
    </Box>
  );
}
