import { ChangeEvent, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Box,
  Checkbox,
  CircularProgress,
  Divider,
  FormControlLabel,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from "@mui/material";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";

import type { DeviceEvent } from "@/features/devices/types/deviceEvents";

type EventTypeKey = "AUTO_TRIGGER" | "HEARTBEAT" | "POWER_MISSING" | "MANUAL";

interface EventTypeMeta {
  key: EventTypeKey;
  labelKey: string;
  color: string;
}

const EVENT_TYPES: EventTypeMeta[] = [
  {
    key: "AUTO_TRIGGER",
    labelKey: "devices.details.eventTypes.autoTrigger",
    color: "#0f8b6f",
  },
  {
    key: "HEARTBEAT",
    labelKey: "devices.details.eventTypes.heartbeat",
    color: "#e0b100",
  },
  {
    key: "POWER_MISSING",
    labelKey: "devices.details.eventTypes.powerMissing",
    color: "#ef4444",
  },
  {
    key: "MANUAL",
    labelKey: "devices.details.eventTypes.manual",
    color: "#6366f1",
  },
];

const DEFAULT_FILTERS: Record<EventTypeKey, boolean> = {
  AUTO_TRIGGER: true,
  HEARTBEAT: true,
  POWER_MISSING: true,
  MANUAL: true,
};

interface DeviceTelemetryTimelineProps {
  events: DeviceEvent[];
  loading: boolean;
  error: string | null;
  tNoData: string;
  selectedDate: string;
}

interface DayBucket {
  label: string;
  startMs: number;
  endMs: number;
  events: DeviceEvent[];
}

interface Marker {
  pct: number;
  time: string;
  on: boolean;
  eventName: string;
  triggerReason?: string | null;
  power?: number | null;
  unit?: string | null;
  eventType: EventTypeMeta;
  eventTypeLabel: string;
}

export function DeviceTelemetryTimeline({
  events,
  loading,
  error,
  tNoData,
  selectedDate,
}: DeviceTelemetryTimelineProps) {
  const { t, i18n } = useTranslation();
  const [filters, setFilters] = useState<Record<EventTypeKey, boolean>>(
    DEFAULT_FILTERS
  );
  const [zoom, setZoom] = useState(1);

  const locale = i18n.language === "pl" ? "pl-PL" : "en-US";

  const dayBucket = useMemo(
    () => buildDayBucket(events, selectedDate, locale),
    [events, locale, selectedDate]
  );

  const filteredEvents = useMemo(() => {
    if (!dayBucket) return [];

    return [...dayBucket.events]
      .filter((event) => {
        const { key } = resolveEventType(event);
        return filters[key];
      })
      .sort(
        (left, right) =>
          new Date(right.created_at).getTime() - new Date(left.created_at).getTime()
      );
  }, [dayBucket, filters]);

  const handleFilterChange =
    (key: EventTypeKey) => (event: ChangeEvent<HTMLInputElement>) => {
      setFilters((prev) => ({ ...prev, [key]: event.target.checked }));
    };

  const zoomIn = () => setZoom((value) => Math.min(value + 0.5, 4));
  const zoomOut = () => setZoom((value) => Math.max(value - 0.5, 1));

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
      <Typography variant="subtitle2" sx={{ color: "#0f172a", fontWeight: 700 }}>
        {dayBucket?.label ?? selectedDate}
      </Typography>

      <Divider sx={{ my: 1.25 }} />

      {loading ? (
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          justifyContent="center"
          sx={{ height: 180 }}
        >
          <CircularProgress size={20} />
          <Typography variant="body2">{t("common.loading")}</Typography>
        </Stack>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : !dayBucket ? (
        <Typography variant="body2" color="text.secondary">
          {tNoData}
        </Typography>
      ) : (
        <>
          <Stack
            direction="row"
            spacing={2}
            mb={1.5}
            flexWrap="wrap"
            alignItems="center"
          >
            <Typography variant="caption" sx={{ color: "#0f172a", fontWeight: 700 }}>
              {t("devices.details.legend")}
            </Typography>

            {EVENT_TYPES.map((item) => (
              <FormControlLabel
                key={item.key}
                control={
                  <Checkbox
                    size="small"
                    checked={filters[item.key]}
                    onChange={handleFilterChange(item.key)}
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
                      }}
                    />
                    <Typography variant="caption" sx={{ color: item.color }}>
                      {t(item.labelKey)}
                    </Typography>
                  </Stack>
                }
              />
            ))}
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            justifyContent="flex-end"
            alignItems="center"
            mb={1}
          >
            <Typography variant="caption" color="text.secondary">
              {t("devices.details.zoom")}
            </Typography>

            <IconButton size="small" onClick={zoomOut} disabled={zoom <= 1}>
              <ZoomOutIcon fontSize="small" />
            </IconButton>

            <Typography
              variant="caption"
              color="primary"
              sx={{ minWidth: 32, textAlign: "center" }}
            >
              {zoom.toFixed(1)}x
            </Typography>

            <IconButton size="small" onClick={zoomIn} disabled={zoom >= 4}>
              <ZoomInIcon fontSize="small" />
            </IconButton>
          </Stack>

          <DayTimeline
            bucket={dayBucket}
            filters={filters}
            resolveEventType={resolveEventType}
            zoom={zoom}
            getLabel={(eventType) => t(eventType.labelKey)}
            emptyStateLabel={t("devices.details.noFilteredEvents")}
          />

          <Divider sx={{ my: 2 }} />

          <Stack spacing={1}>
            <Typography variant="subtitle2" sx={{ color: "#0f172a", fontWeight: 700 }}>
              {t("devices.details.eventsListTitle")}
            </Typography>

            {filteredEvents.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                {t("devices.details.noFilteredEvents")}
              </Typography>
            ) : (
              filteredEvents.slice(0, 20).map((event) => {
                const eventType = resolveEventType(event);
                const createdAt = new Date(event.created_at);
                const measuredValue =
                  event.measured_value != null
                    ? `${event.measured_value} ${event.measured_unit ?? ""}`.trim()
                    : null;

                return (
                  <Box
                    key={`${event.id}-${event.created_at}-${event.pin_state}`}
                    sx={{
                      borderRadius: 1.5,
                      border: "1px solid rgba(15,139,111,0.14)",
                      p: 1.25,
                      background: "#f8fbf8",
                    }}
                  >
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={0.75}
                      justifyContent="space-between"
                    >
                      <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
                        <Box
                          sx={{
                            width: 10,
                            height: 10,
                            borderRadius: "50%",
                            backgroundColor: eventType.color,
                          }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: "#0f172a" }}>
                          {event.event_name}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#64748b" }}>
                          {t(eventType.labelKey)}
                        </Typography>
                      </Stack>

                      <Typography variant="caption" sx={{ color: "#475569" }}>
                        {createdAt.toLocaleString()}
                      </Typography>
                    </Stack>

                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      mt={0.75}
                      color="text.secondary"
                    >
                      <Typography variant="caption">
                        {event.pin_state
                          ? t("devices.details.stateOn")
                          : t("devices.details.stateOff")}
                      </Typography>

                      {event.trigger_reason && (
                        <Typography variant="caption">{event.trigger_reason}</Typography>
                      )}

                      {measuredValue && (
                        <Typography variant="caption">{measuredValue}</Typography>
                      )}

                      <Typography variant="caption">
                        {event.source === "LIVE_DEVICE_EVENT" ||
                        event.source === "LIVE_HEARTBEAT"
                          ? t("devices.details.sources.live")
                          : t("devices.details.sources.history")}
                      </Typography>
                    </Stack>
                  </Box>
                );
              })
            )}
          </Stack>
        </>
      )}
    </Box>
  );
}

function DayTimeline({
  bucket,
  filters,
  resolveEventType,
  zoom,
  getLabel,
  emptyStateLabel,
}: {
  bucket: DayBucket;
  filters: Record<EventTypeKey, boolean>;
  resolveEventType: (event: DeviceEvent) => EventTypeMeta;
  zoom: number;
  getLabel: (eventType: EventTypeMeta) => string;
  emptyStateLabel: string;
}) {
  const spanMs = Math.max(1, bucket.endMs - bucket.startMs);
  const now = Date.now();
  const clampEndMs =
    bucket.startMs <= now && now < bucket.endMs ? now : bucket.endMs;

  const filteredEvents = bucket.events.filter((event) => {
    const { key } = resolveEventType(event);
    return filters[key];
  });

  const sorted = [...filteredEvents].sort(
    (left, right) =>
      new Date(left.created_at).getTime() - new Date(right.created_at).getTime()
  );

  const dayEmpty = sorted.length === 0;

  const segments: { startPct: number; widthPct: number; on: boolean }[] = [];
  const markers: Marker[] = [];

  let currentState = false;
  let currentStart = bucket.startMs;

  sorted.forEach((event) => {
    const eventType = resolveEventType(event);
    const rawTimestamp = new Date(event.created_at).getTime();
    const timestamp = Math.min(Math.max(rawTimestamp, bucket.startMs), clampEndMs);

    const delta = timestamp - currentStart;
    if (delta > 0) {
      segments.push({
        startPct: ((currentStart - bucket.startMs) / spanMs) * 100,
        widthPct: (delta / spanMs) * 100,
        on: currentState,
      });
    }

    markers.push({
      pct: ((timestamp - bucket.startMs) / spanMs) * 100,
      time: new Date(event.created_at).toLocaleTimeString(),
      on: event.pin_state,
      eventName: event.event_name,
      triggerReason: event.trigger_reason,
      power: event.measured_value,
      unit: event.measured_unit,
      eventType,
      eventTypeLabel: getLabel(eventType),
    });

    currentState = event.pin_state;
    currentStart = timestamp;
  });

  if (currentStart < clampEndMs) {
    const delta = clampEndMs - currentStart;
    segments.push({
      startPct: ((currentStart - bucket.startMs) / spanMs) * 100,
      widthPct: (delta / spanMs) * 100,
      on: currentState,
    });
  }

  const hourStep = resolveHourTickStep(zoom);
  const ticks = buildHourTicks(hourStep);
  const detailedTickLabels = hourStep <= 2;

  return (
    <Box
      sx={{
        position: "relative",
        mt: 1,
        overflowX: "auto",
        overflowY: "hidden",
        borderRadius: 2,
      }}
    >
      <Box
        sx={{
          position: "relative",
          height: 240,
          minWidth: "100%",
          width: `${zoom * 100}%`,
          borderRadius: 2,
          background: "linear-gradient(180deg, #f8fbf8 0%, #eef5f3 100%)",
          overflow: "hidden",
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
            background:
              "linear-gradient(90deg, rgba(15,139,111,0.12), rgba(15,139,111,0.28))",
            boxShadow: "inset 0 0 0 1px rgba(15,139,111,0.08)",
          }}
        />

        {segments.map((segment, index) => (
          <Box
            key={`${segment.startPct}-${segment.widthPct}-${index}`}
            sx={{
              position: "absolute",
              left: `${segment.startPct}%`,
              width: `${segment.widthPct}%`,
              top: 116,
              height: 18,
              borderRadius: 999,
              background: segment.on
                ? "linear-gradient(135deg, #0f8b6f, #12b886)"
                : "linear-gradient(135deg, #d1d5db, #e5e7eb)",
              boxShadow: segment.on ? "0 8px 14px rgba(15,139,111,0.35)" : "none",
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
            {emptyStateLabel}
          </Box>
        )}

        {markers.map((marker, index) => (
          <Tooltip
            key={`${marker.pct}-${marker.time}-${index}`}
            title={
              <Stack spacing={0.5}>
                <Typography variant="caption" sx={{ fontWeight: 600 }}>
                  {marker.eventName}
                </Typography>

                <Typography variant="caption" sx={{ opacity: 0.75 }}>
                  {marker.time}
                </Typography>

                <Typography variant="caption" sx={{ opacity: 0.75 }}>
                  {marker.eventTypeLabel}
                </Typography>

                {marker.triggerReason && (
                  <Typography variant="caption" sx={{ opacity: 0.65 }}>
                    {marker.triggerReason}
                  </Typography>
                )}

                {marker.power != null && (
                  <Typography variant="caption">
                    {`${marker.power} ${marker.unit ?? ""}`.trim()}
                  </Typography>
                )}
              </Stack>
            }
            placement="top"
          >
            <Box
              sx={{
                position: "absolute",
                left: `${marker.pct}%`,
                transform: "translateX(-50%)",
                top: 80,
                width: 14,
                height: 14,
                borderRadius: "50%",
                backgroundColor: marker.eventType.color,
                border: "2px solid #ffffff",
                boxShadow: marker.on
                  ? "0 0 10px rgba(15,139,111,0.35)"
                  : "0 0 6px rgba(0,0,0,0.12)",
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
          {ticks.map((hour) => (
            <Stack key={hour} spacing={0.5} alignItems="center">
              <Box
                sx={{ width: 2, height: 14, backgroundColor: "rgba(15,139,111,0.35)" }}
              />
              <Typography variant="caption">
                {formatHourTickLabel(hour, detailedTickLabels)}
              </Typography>
            </Stack>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function resolveHourTickStep(zoom: number): number {
  if (zoom >= 3) return 1;
  if (zoom >= 2) return 2;
  if (zoom >= 1.5) return 3;
  return 4;
}

function buildHourTicks(step: number): number[] {
  const safeStep = Math.max(1, Math.floor(step));
  const ticks: number[] = [];

  for (let hour = 0; hour <= 24; hour += safeStep) {
    ticks.push(hour);
  }

  if (ticks[ticks.length - 1] !== 24) {
    ticks.push(24);
  }

  return ticks;
}

function formatHourTickLabel(hour: number, detailed: boolean): string {
  const hourLabel = String(hour).padStart(2, "0");
  return detailed ? `${hourLabel}:00` : hourLabel;
}

function buildDayBucket(
  events: DeviceEvent[],
  selectedDate: string,
  locale: string
): DayBucket | null {
  if (!selectedDate) return null;

  const dayStart = new Date(`${selectedDate}T00:00:00`);
  if (Number.isNaN(dayStart.getTime())) return null;

  const dayEnd = new Date(dayStart);
  dayEnd.setHours(23, 59, 59, 999);

  const dayEvents = events.filter((event) => {
    const timestamp = new Date(event.created_at).getTime();
    return timestamp >= dayStart.getTime() && timestamp <= dayEnd.getTime();
  });

  return {
    label: dayStart.toLocaleDateString(locale, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    }),
    startMs: dayStart.getTime(),
    endMs: dayEnd.getTime(),
    events: dayEvents,
  };
}

function resolveEventType(event: DeviceEvent): EventTypeMeta {
  switch (event.event_type) {
    case "AUTO_TRIGGER":
      return EVENT_TYPES[0];

    case "HEARTBEAT":
      return EVENT_TYPES[1];

    case "ERROR":
      if (event.trigger_reason?.includes("POWER")) {
        return EVENT_TYPES[2];
      }

      if (event.trigger_reason?.includes("HEARTBEAT")) {
        return EVENT_TYPES[1];
      }

      return EVENT_TYPES[3];

    case "STATE":
    case "MODE":
    case "SCHEDULER":
    default:
      return EVENT_TYPES[3];
  }
}
