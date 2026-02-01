import { useEffect, useMemo, useState, ChangeEvent } from "react";

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
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";

import type { DeviceEvent } from "@/features/devices/types/deviceEvents";

type EventTypeKey = "AUTO_TRIGGER" | "HEARTBEAT_FAILURE" | "POWER_MISSING" | "MANUAL";

interface EventTypeMeta {
  key: EventTypeKey;
  label: string;
  color: string;
}

const EVENT_TYPES: EventTypeMeta[] = [
  { key: "AUTO_TRIGGER", label: "Auto trigger", color: "#0f8b6f" },
  { key: "HEARTBEAT_FAILURE", label: "Heartbeat failure", color: "#e0b100" },
  { key: "POWER_MISSING", label: "Power missing", color: "#ef4444" },
  { key: "MANUAL", label: "Manual", color: "#6366f1" },
];

const DEFAULT_FILTERS: Record<EventTypeKey, boolean> = {
  AUTO_TRIGGER: true,
  HEARTBEAT_FAILURE: true,
  POWER_MISSING: true,
  MANUAL: true,
};

interface DeviceTelemetryTimelineProps {
  events: DeviceEvent[];
  loading: boolean;
  error: string | null;
  tNoData: string;
  start: string;
  end: string;
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
  reason?: string | null;
  power?: number | null;
  unit?: string | null;
  eventType: EventTypeMeta;
}

export function DeviceTelemetryTimeline({
  events,
  loading,
  error,
  tNoData,
  start,
  end,
}: DeviceTelemetryTimelineProps) {
  const [activeDayIndex, setActiveDayIndex] = useState(0);
  const [filters, setFilters] = useState<Record<EventTypeKey, boolean>>(DEFAULT_FILTERS);
  const [zoom, setZoom] = useState(1);

  const dayBuckets = useMemo(() => buildDayBuckets(events, start, end), [events, start, end]);
  const nonEmptyBuckets = dayBuckets.filter((bucket) => bucket.events.length > 0);
  const safeIndex = Math.min(activeDayIndex, Math.max(nonEmptyBuckets.length - 1, 0));
  const active = nonEmptyBuckets[safeIndex];

  useEffect(() => {
    if (activeDayIndex !== safeIndex) {
      setActiveDayIndex(safeIndex);
    }
  }, [activeDayIndex, safeIndex]);

  useEffect(() => {
    setActiveDayIndex(0);
  }, [start, end, events]);

  const handleFilterChange = (key: EventTypeKey) => (e: ChangeEvent<HTMLInputElement>) => {
    const checked = e.target.checked;
    setFilters((prev) => ({ ...prev, [key]: checked }));
  };

  const zoomIn = () => setZoom((z) => Math.min(z + 0.5, 4));
  const zoomOut = () => setZoom((z) => Math.max(z - 0.5, 1));

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
          onClick={() =>
            setActiveDayIndex((idx) => Math.min(idx + 1, Math.max(nonEmptyBuckets.length - 1, 0)))
          }
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
            <>
              <Stack direction="row" spacing={1} justifyContent="flex-end" alignItems="center" mb={1}>
                <Typography variant="caption" color="text.secondary">
                  Zoom
                </Typography>
                <IconButton size="small" onClick={zoomOut} disabled={zoom <= 1}>
                  <ZoomOutIcon fontSize="small" />
                </IconButton>
                <Typography variant="caption" sx={{ minWidth: 32, textAlign: "center" }}>
                  {zoom.toFixed(1)}x
                </Typography>
                <IconButton size="small" onClick={zoomIn} disabled={zoom >= 4}>
                  <ZoomInIcon fontSize="small" />
                </IconButton>
              </Stack>
              <DayTimeline
                bucket={active}
                filters={filters}
                resolveEventType={resolveEventType}
                zoom={zoom}
              />
            </>
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

function DayTimeline({
  bucket,
  filters,
  resolveEventType,
  zoom,
}: {
  bucket: DayBucket;
  filters: Record<EventTypeKey, boolean>;
  resolveEventType: (event: DeviceEvent) => EventTypeMeta;
  zoom: number;
}) {
  const spanMs = bucket.endMs - bucket.startMs;
  const now = Date.now();
  const clampEndMs = bucket.startMs <= now && now < bucket.endMs ? now : bucket.endMs;
  const filteredEvents = bucket.events.filter((ev) => {
    const { key } = resolveEventType(ev);
    return filters[key];
  });
  const sorted = [...filteredEvents].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );
  const dayEmpty = sorted.length === 0;

  const segments: { startPct: number; widthPct: number; on: boolean }[] = [];
  const markers: Marker[] = [];

  let currentState = false;
  let currentStart = bucket.startMs;

  sorted.forEach((ev) => {
    const eventType = resolveEventType(ev);
    const raw = new Date(ev.created_at).getTime();
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
      time: new Date(ev.created_at).toLocaleTimeString(),
      on: ev.pin_state,
      reason: ev.trigger_reason ?? ev.event_type,
      power: ev.measured_value,
      unit: ev.measured_unit,
      eventType,
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
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <Box
                    sx={{
                      width: 8,
                      height: 8,
                      borderRadius: "50%",
                      backgroundColor: m.eventType.color,
                      boxShadow: `0 0 0 1px ${m.eventType.color}40`,
                    }}
                  />
                  <Typography variant="caption" sx={{ color: "white", fontWeight: 600 }}>
                    {m.eventType.label || m.reason}
                  </Typography>
                </Stack>
                {m.power != null && (
                  <Typography variant="caption">{`${m.power} ${m.unit ?? ""}`}</Typography>
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
              <Typography variant="caption">{`${String(h).padStart(2, "0")}:00`}</Typography>
            </Stack>
          ))}
        </Box>
      </Box>
    </Box>
  );
}

function buildDayBuckets(events: DeviceEvent[], start: string, end: string): DayBucket[] {
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
    const ts = new Date(ev.created_at).getTime();
    const bucket = days.find((d) => ts >= d.startMs && ts <= d.endMs);
    if (bucket) bucket.events.push(ev);
  });

  return days;
}

function resolveEventType(ev: DeviceEvent): EventTypeMeta {
  const normalized = `${ev.event_type ?? ""} ${ev.trigger_reason ?? ""}`.toUpperCase();
  if (normalized.includes("AUTO")) return EVENT_TYPES[0];
  if (normalized.includes("HEARTBEAT")) return EVENT_TYPES[1];
  if (normalized.includes("POWER")) return EVENT_TYPES[2];
  return EVENT_TYPES[3];
}
