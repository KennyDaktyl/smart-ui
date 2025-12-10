import { useEffect, useMemo, useState } from "react";
import { Alert, Box, Button, Chip, CircularProgress, Stack, Tab, Tabs, Typography, TextField } from "@mui/material";
import Grid from "@mui/material/Grid2";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { deviceApi } from "@/api/deviceApi";
import { DeviceInfoTile } from "@/features/devices/components/DeviceInfoTile";
import { DeviceTelemetryTimeline } from "@/features/devices/components/DeviceTelemetryTimeline";
import { useDeviceEvents } from "@/features/devices/hooks/useDeviceEvents";

type DeviceLocationState = {
  device?: any;
  raspberryName?: string;
  raspberryId?: number;
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
  const [tab, setTab] = useState("details");
  const [loading, setLoading] = useState(!locationState.device);
  const [error, setError] = useState<string | null>(null);

  const today = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    return {
      start: start.toISOString().slice(0, 16),
      end: now.toISOString().slice(0, 16),
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
      } catch {
        setError(t("devices.details.loadError"));
      } finally {
        setLoading(false);
      }
    };

    fetchDevice();
  }, [token, locationState.device, id, t]);

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

  const stateLabel = device?.is_on ? t("devices.details.stateOn") : t("devices.details.stateOff");
  const onlineLabel = device?.online ? t("common.online") : t("common.offline");

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
              <Typography variant="caption" sx={{ color: "rgba(226,242,236,0.75)", letterSpacing: 0.5 }}>
                {t("devices.details.breadcrumb", {
                  raspberryId: raspberryId || device.raspberry_id || "?",
                  device: device.name,
                })}
              </Typography>
              <Typography variant="overline" sx={{ letterSpacing: 1, color: "rgba(226,242,236,0.8)" }}>
                {raspberryName
                  ? t("devices.details.raspberryLabel", { name: raspberryName })
                  : t("devices.details.raspberryFallback")}
              </Typography>
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
              "& .MuiTab-root": { color: "rgba(226,242,236,0.7)" },
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
            <Grid container spacing={2}>
              <Grid xs={12} sm={6} md={4}>
                <DeviceInfoTile
                  label={t("devices.details.fields.slot")}
                  value={String(device.device_number ?? "-")}
                />
              </Grid>
              <Grid xs={12} sm={6} md={4}>
                <DeviceInfoTile
                  label={t("devices.details.fields.power")}
                  value={
                    device.rated_power_kw != null
                      ? `${device.rated_power_kw} kW`
                      : t("common.notAvailable")
                  }
                />
              </Grid>
              <Grid xs={12} sm={6} md={4}>
                <DeviceInfoTile
                  label={t("devices.details.fields.threshold")}
                  value={
                    device.threshold_kw != null ? `${device.threshold_kw} kW` : t("common.notAvailable")
                  }
                />
              </Grid>
              <Grid xs={12} sm={6} md={4}>
                <DeviceInfoTile label={t("devices.details.fields.mode")} value={modeLabel} />
              </Grid>
              <Grid xs={12} sm={6} md={4}>
                <DeviceInfoTile label={t("devices.details.fields.state")} value={stateLabel} />
              </Grid>
              <Grid xs={12} sm={6} md={4}>
                <DeviceInfoTile
                  label={t("devices.details.fields.status")}
                  value={onlineLabel}
                />
              </Grid>
              <Grid xs={12} sm={6} md={4}>
                <DeviceInfoTile
                  label={t("devices.details.fields.raspberryId")}
                  value={device.raspberry_id ? String(device.raspberry_id) : t("common.notAvailable")}
                />
              </Grid>
              <Grid xs={12} sm={6} md={4}>
                <DeviceInfoTile label={t("devices.details.fields.lastUpdate")} value={formattedLastUpdate} />
              </Grid>
            </Grid>
          )}
          {tab === "telemetry" && (
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label={t("devices.details.rangeStart")}
                  type="datetime-local"
                  size="small"
                  fullWidth
                  sx={{ flex: 1, minWidth: 0 }}
                  value={range.start}
                  onChange={(e) => setRange((prev) => ({ ...prev, start: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label={t("devices.details.rangeEnd")}
                  type="datetime-local"
                  size="small"
                  fullWidth
                  sx={{ flex: 1, minWidth: 0 }}
                  value={range.end}
                  onChange={(e) => setRange((prev) => ({ ...prev, end: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>

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
