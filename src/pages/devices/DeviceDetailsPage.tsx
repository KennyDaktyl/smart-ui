import { useEffect, useMemo, useState, Dispatch, SetStateAction } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Paper,
  Stack,
  Tab,
  Tabs,
  Typography,
  TextField,
  Tooltip,
  IconButton,
  FormControlLabel,
  Checkbox,
  Divider,
} from "@mui/material";
import Grid from "@mui/material/Grid2";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { deviceApi } from "@/api/deviceApi";
import { deviceEventsApi } from "@/api/deviceEventsApi";

type DeviceLocationState = {
  device?: any;
  raspberryName?: string;
  raspberryId?: number;
};

function InfoTile({ label, value }: { label: string; value: string }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        borderRadius: 2,
        borderColor: "rgba(15,139,111,0.14)",
        background: "linear-gradient(135deg, #ffffff 0%, #f6fbf8 100%)",
        height: "100%",
      }}
    >
      <Typography variant="caption" sx={{ color: "#64748b" }}>
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={600} sx={{ color: "#0f172a" }}>
        {value}
      </Typography>
    </Paper>
  );
}

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

  const [events, setEvents] = useState<any[]>([]);
  const [summary, setSummary] = useState<{ total_minutes_on?: number; energy_kwh?: number; rated_power_kw?: number }>({});

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
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventsError, setEventsError] = useState<string | null>(null);
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [filters, setFilters] = useState<Record<string, boolean>>({
    AUTO_TRIGGER: true,
    HEARTBEAT_FAILURE: true,
    POWER_MISSING: true,
    MANUAL: true,
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

  useEffect(() => {
    if (!token || !id || !range.start || !range.end) return;
    if (tab !== "telemetry") return;

    const fetchEvents = async () => {
      setLoadingEvents(true);
      setEventsError(null);
      try {
        const res = await deviceEventsApi.getDeviceEvents(
          token,
          Number(id),
          new Date(range.start).toISOString(),
          new Date(range.end).toISOString()
        );
        setEvents(res.data?.events ?? []);
        setSummary({
          total_minutes_on: res.data?.total_minutes_on,
          energy_kwh: res.data?.energy_kwh,
          rated_power_kw: res.data?.rated_power_kw,
        });
        setActiveDayIndex(0);
      } catch {
        setEventsError(t("devices.details.eventsError"));
      } finally {
        setLoadingEvents(false);
      }
    };

    fetchEvents();
  }, [token, id, range.start, range.end, t, tab]);

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
          <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={2}>
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

            <Stack direction="row" spacing={1}>
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
                <InfoTile
                  label={t("devices.details.fields.slot")}
                  value={String(device.device_number ?? "-")}
                />
              </Grid>
              <Grid xs={12} sm={6} md={4}>
                <InfoTile
                  label={t("devices.details.fields.power")}
                  value={
                    device.rated_power_kw != null
                      ? `${device.rated_power_kw} kW`
                      : t("common.notAvailable")
                  }
                />
              </Grid>
              <Grid xs={12} sm={6} md={4}>
                <InfoTile
                  label={t("devices.details.fields.threshold")}
                  value={
                    device.threshold_kw != null ? `${device.threshold_kw} kW` : t("common.notAvailable")
                  }
                />
              </Grid>
              <Grid xs={12} sm={6} md={4}>
                <InfoTile label={t("devices.details.fields.mode")} value={modeLabel} />
              </Grid>
              <Grid xs={12} sm={6} md={4}>
                <InfoTile label={t("devices.details.fields.state")} value={stateLabel} />
              </Grid>
              <Grid xs={12} sm={6} md={4}>
                <InfoTile
                  label={t("devices.details.fields.status")}
                  value={onlineLabel}
                />
              </Grid>
              <Grid xs={12} sm={6} md={4}>
                <InfoTile
                  label={t("devices.details.fields.raspberryId")}
                  value={device.raspberry_id ? String(device.raspberry_id) : t("common.notAvailable")}
                />
              </Grid>
              <Grid xs={12} sm={6} md={4}>
                <InfoTile label={t("devices.details.fields.lastUpdate")} value={formattedLastUpdate} />
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
                  value={range.start}
                  onChange={(e) => setRange((prev) => ({ ...prev, start: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  label={t("devices.details.rangeEnd")}
                  type="datetime-local"
                  size="small"
                  value={range.end}
                  onChange={(e) => setRange((prev) => ({ ...prev, end: e.target.value }))}
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <InfoTile
                  label={t("devices.details.fields.energy")}
                  value={
                    summary.energy_kwh != null
                      ? `${summary.energy_kwh.toFixed(2)} kWh`
                      : t("common.notAvailable")
                  }
                />
                <InfoTile
                  label={t("devices.details.fields.totalMinutes")}
                  value={
                    summary.total_minutes_on != null
                      ? `${summary.total_minutes_on} min`
                      : t("common.notAvailable")
                  }
                />
                <InfoTile
                  label={t("devices.details.fields.ratedPower")}
                  value={
                    summary.rated_power_kw != null
                      ? `${summary.rated_power_kw} kW`
                      : t("common.notAvailable")
                  }
                />
              </Stack>

              {eventsError && <Alert severity="error">{eventsError}</Alert>}

              <TelemetryCarousel
                events={events}
                loading={loadingEvents}
                error={eventsError}
                tNoData={t("devices.details.noEvents")}
                start={range.start}
                end={range.end}
                activeDayIndex={activeDayIndex}
                setActiveDayIndex={setActiveDayIndex}
                filters={filters}
              />
            </Stack>
          )}
        </Box>
      </Box>
    </Box>
  );
}

interface TimelineEvent {
  timestamp: string;
  pin_state: boolean;
  power_kw?: number;
  trigger_reason?: string | null;
}

interface TelemetryCarouselProps {
  events: TimelineEvent[];
  loading: boolean;
  error: string | null;
  tNoData: string;
  start: string;
  end: string;
  activeDayIndex: number;
  setActiveDayIndex: Dispatch<SetStateAction<number>>;
  filters: Record<string, boolean>;
}

function TelemetryCarousel({
  events,
  loading,
  error,
  tNoData,
  start,
  end,
  activeDayIndex,
  setActiveDayIndex,
  filters,
}: TelemetryCarouselProps) {
  const dayBuckets = buildDayBuckets(events, start, end);
  const nonEmptyBuckets = dayBuckets.filter((b) => b.events.length > 0);
  const safeIndex = Math.min(activeDayIndex, Math.max(nonEmptyBuckets.length - 1, 0));
  const active = nonEmptyBuckets[safeIndex];
  const legendItems = [
    { key: "AUTO_TRIGGER", label: "Auto trigger", color: "#0f8b6f" },
    { key: "HEARTBEAT_FAILURE", label: "Heartbeat failure", color: "#e0b100" },
    { key: "POWER_MISSING", label: "Power missing", color: "#ef4444" },
    { key: "MANUAL", label: "Manual", color: "#6366f1" },
  ];

  useEffect(() => {
    if (activeDayIndex !== safeIndex) {
      setActiveDayIndex(safeIndex);
    }
  }, [activeDayIndex, safeIndex, setActiveDayIndex]);

  return (
    <Box
      sx={{
        borderRadius: 2,
        border: "1px solid rgba(15,139,111,0.18)",
        background: "#ffffff",
        p: 2,
        minHeight: 280,
      }}
    >
      <Stack direction="row" alignItems="center" spacing={1} mb={1}>
        <IconButton
          size="small"
          onClick={() => setActiveDayIndex((idx) => Math.max(idx - 1, 0))}
          disabled={safeIndex === 0}
        >
          <ChevronLeftIcon />
        </IconButton>
        <Typography variant="subtitle2" sx={{ flex: 1, textAlign: "center", color: "#0f172a" }}>
          {active ? active.label : ""}
        </Typography>
        <IconButton
          size="small"
          onClick={() => setActiveDayIndex((idx) => Math.min(idx + 1, Math.max(nonEmptyBuckets.length - 1, 0)))}
          disabled={safeIndex >= nonEmptyBuckets.length - 1}
        >
          <ChevronRightIcon />
        </IconButton>
      </Stack>

      <Divider sx={{ my: 1 }} />

      {loading ? (
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="center" sx={{ height: 180 }}>
          <CircularProgress size={20} />
          <Typography variant="body2">Loading…</Typography>
        </Stack>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : (
        <>
          <Stack direction="row" spacing={2} mb={1.5} flexWrap="wrap" alignItems="center">
            <Typography variant="caption" sx={{ color: "#0f172a", fontWeight: 700 }}>
              Legend:
            </Typography>
            {legendItems.map((item) => (
              <FormControlLabel
                key={item.key}
                control={
                  <Checkbox
                    size="small"
                    checked={filters[item.key]}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      filters[item.key] = checked;
                      setActiveDayIndex((idx) => idx); // trigger rerender
                    }}
                    sx={{
                      color: item.color,
                      "&.Mui-checked": { color: item.color },
                    }}
                  />
                }
                label={
                  <Stack direction="row" spacing={0.75} alignItems="center">
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: "50%",
                        backgroundColor: item.color,
                        boxShadow: `0 0 10px ${item.color}55`,
                      }}
                    />
                    <Typography variant="caption" sx={{ color: "#0f172a" }}>
                      {item.label}
                    </Typography>
                  </Stack>
                }
              />
            ))}
          </Stack>

          {active ? (
            <DayTimeline bucket={active} filters={filters} />
          ) : (
            <Box sx={{ height: 220, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Typography variant="body2" color="text.secondary">
                {tNoData}
              </Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

function EmptyTimeline({ dayLabel, message }: { dayLabel?: string; message: string }) {
  return (
    <Box sx={{ height: 220, position: "relative" }}>
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          borderRadius: 2,
          border: "1px dashed rgba(15,139,111,0.25)",
          background: "linear-gradient(180deg, #f8fbf8 0%, #eef5f3 100%)",
        }}
      />
      <Typography
        variant="caption"
        sx={{ position: "absolute", top: 12, left: 16, color: "#6b7280" }}
      >
        {dayLabel}
      </Typography>
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
      >
        {message}
      </Typography>
    </Box>
  );
}

interface DayBucket {
  label: string;
  startMs: number;
  endMs: number;
  events: TimelineEvent[];
}

function buildDayBuckets(events: TimelineEvent[], start: string, end: string): DayBucket[] {
  const startDate = new Date(start);
  const endDate = new Date(end);
  const days: DayBucket[] = [];

  const dayStart = (d: Date) => {
    const copy = new Date(d);
    copy.setHours(0, 0, 0, 0);
    return copy;
  };
  let cursor = dayStart(startDate);

  while (cursor <= endDate) {
    const dayEnd = new Date(cursor);
    dayEnd.setHours(23, 59, 59, 999);
    days.push({
      label: cursor.toLocaleDateString(),
      startMs: cursor.getTime(),
      endMs: dayEnd.getTime(),
      events: [],
    });
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }

  events.forEach((ev) => {
    const ts = new Date(ev.timestamp).getTime();
    const bucket = days.find((d) => ts >= d.startMs && ts <= d.endMs);
    if (bucket) bucket.events.push(ev);
  });

  return days;
}

function DayTimeline({ bucket, filters }: { bucket: DayBucket; filters: Record<string, boolean> }) {
  const spanMs = bucket.endMs - bucket.startMs;
  const now = Date.now();
  const clampEndMs =
    bucket.startMs <= now && now < bucket.endMs ? now : bucket.endMs;
  const filteredEvents = bucket.events.filter((ev) => {
    const reason = (ev.trigger_reason || "").toUpperCase();
    if (reason.includes("AUTO")) return filters.AUTO_TRIGGER;
    if (reason.includes("HEARTBEAT")) return filters.HEARTBEAT_FAILURE;
    if (reason.includes("POWER")) return filters.POWER_MISSING;
    return filters.MANUAL;
  });

  const sorted = [...filteredEvents].sort(
    (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );
  const dayEmpty = sorted.length === 0;

  const segments: {
    startPct: number;
    widthPct: number;
    on: boolean;
  }[] = [];
  const markers: {
    pct: number;
    time: string;
    on: boolean;
    reason?: string | null;
    power?: number;
  }[] = [];

  let currentState = false;
  let currentStart = bucket.startMs;

  sorted.forEach((ev) => {
    const raw = new Date(ev.timestamp).getTime();
    const ts = Math.min(Math.max(raw, bucket.startMs), clampEndMs);
    const delta = ts - currentStart;
    if (delta > 0) {
      segments.push({
        startPct: ((currentStart - bucket.startMs) / spanMs) * 100,
        widthPct: (delta / spanMs) * 100,
        on: currentState,
      });
    }
    markers.push({
      pct: ((ts - bucket.startMs) / spanMs) * 100,
      time: new Date(ev.timestamp).toLocaleTimeString(),
      on: ev.pin_state,
      reason: ev.trigger_reason,
      power: ev.power_kw,
    });

    currentState = ev.pin_state;
    currentStart = ts;
  });

  if (currentStart < clampEndMs) {
    const delta = clampEndMs - currentStart;
    segments.push({
      startPct: ((currentStart - bucket.startMs) / spanMs) * 100,
      widthPct: (delta / spanMs) * 100,
      on: currentState,
    });
  }

  const ticks = [0, 6, 12, 18, 24];

  return (
    <Box
      sx={{
        height: 240,
        position: "relative",
        borderRadius: 2,
        background: "linear-gradient(180deg, #f8fbf8 0%, #eef5f3 100%)",
        overflow: "hidden",
        mt: 1,
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "linear-gradient(90deg, rgba(15,139,111,0.06) 1px, transparent 1px), linear-gradient(180deg, rgba(15,139,111,0.05) 1px, transparent 1px)",
          backgroundSize: "80px 60px",
          opacity: 0.8,
          pointerEvents: "none",
        }}
      />
      <Box
        sx={{
          position: "absolute",
          top: 120,
          left: 8,
          right: 8,
          height: 10,
          borderRadius: 999,
          background: "linear-gradient(90deg, rgba(15,139,111,0.12), rgba(15,139,111,0.28))",
          boxShadow: "inset 0 0 0 1px rgba(15,139,111,0.08)",
        }}
      />

      {segments.map((seg, idx) => (
        <Box
          key={idx}
          sx={{
            position: "absolute",
            left: `${seg.startPct}%`,
            width: `${seg.widthPct}%`,
            top: 116,
            height: 18,
            borderRadius: 999,
            background: seg.on
              ? "linear-gradient(135deg, #0f8b6f, #12b886)"
              : "linear-gradient(135deg, #d1d5db, #e5e7eb)",
            boxShadow: seg.on ? "0 8px 14px rgba(15,139,111,0.35)" : "none",
            minWidth: 2,
          }}
        />
      ))}

      {dayEmpty && (
        <Box
          sx={{
            position: "absolute",
            left: "50%",
            top: "55%",
            transform: "translate(-50%, -50%)",
            color: "#94a3b8",
            fontSize: 12,
          }}
        >
          No events this day (timeline still shows 24h scale)
        </Box>
      )}

      {markers.map((m, idx) => (
        <Tooltip
          key={idx}
          title={
            <Stack spacing={0.5}>
              <Typography variant="caption">{m.time}</Typography>
              {m.reason && (
                <Typography variant="caption" sx={{ color: "#0f8b6f" }}>
                  {m.reason}
                </Typography>
              )}
              {m.power != null && (
                <Typography variant="caption">{`${m.power} kW`}</Typography>
              )}
            </Stack>
          }
          placement="top"
        >
          <Box
            sx={{
              position: "absolute",
              left: `${m.pct}%`,
              transform: "translateX(-50%)",
              top: 80,
              width: 14,
              height: 14,
              borderRadius: "50%",
              background: m.on
                ? "linear-gradient(135deg, #0f8b6f, #12b886)"
                : "linear-gradient(135deg, #d1d5db, #e5e7eb)",
              border: "2px solid #ffffff",
              boxShadow: m.on ? "0 0 10px rgba(15,139,111,0.35)" : "0 0 6px rgba(0,0,0,0.12)",
              cursor: "pointer",
            }}
          />
        </Tooltip>
      ))}

      <Box
        sx={{
          position: "absolute",
          left: 12,
          right: 12,
          bottom: 26,
          display: "flex",
          justifyContent: "space-between",
          color: "#475569",
          fontWeight: 600,
        }}
      >
        {ticks.map((h) => (
          <Stack key={h} spacing={0.5} alignItems="center">
            <Box sx={{ width: 2, height: 14, backgroundColor: "rgba(15,139,111,0.35)" }} />
            <Typography variant="caption">
              {`${String(h).padStart(2, "0")}:00`}
            </Typography>
          </Stack>
        ))}
      </Box>
    </Box>
  );
}
