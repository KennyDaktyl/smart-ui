import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ProviderMeasurement } from "../types/userProvider";

/* ===================== TYPES ===================== */

type ProviderTelemetryChartProps = {
  dayKey: string;
  dayLabel?: string;
  measurements: ProviderMeasurement[];
  unit?: string | null;
  noDataLabel: string;
};

type ChartPoint = {
  x: number;
  y: number;
  value: number;
  timeLabel: string;
  dateTimeLabel: string;
};

/* ===================== CONSTANTS ===================== */

const DAY_MS = 24 * 60 * 60 * 1000;

const MIN_ZOOM = 1;
const MAX_ZOOM = 24;

const BASE_WIDTH = 1000;
const HEIGHT = 240;

const PADDING_X = 56;
const PADDING_TOP = 16;
const PADDING_BOTTOM = 40;

const WARSAW_TZ = "Europe/Warsaw";

/* ===================== HELPERS ===================== */

const formatTimeWarsaw = (ts: number, locale: string) =>
  new Intl.DateTimeFormat(locale, {
    timeZone: WARSAW_TZ,
    hour: "2-digit",
    minute: "2-digit",
  }).format(ts);

const formatDateTimeWarsaw = (ts: number, locale: string) =>
  new Intl.DateTimeFormat(locale, {
    timeZone: WARSAW_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(ts);

/* ===================== COMPONENT ===================== */

export function ProviderTelemetryChart({
  dayKey,
  dayLabel,
  measurements,
  unit,
  noDataLabel,
}: ProviderTelemetryChartProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language === "pl" ? "pl-PL" : "en-US";
  const [zoom, setZoom] = useState(1);

  const dayStartMs = useMemo(
    () => Date.parse(`${dayKey}T00:00:00Z`),
    [dayKey]
  );

  const resolvedDayLabel = useMemo(() => {
    if (dayLabel) return dayLabel;
    return new Date(`${dayKey}T00:00:00Z`).toLocaleDateString(locale, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }, [dayKey, dayLabel, locale]);

  const chart = useMemo(() => {
    const width = BASE_WIDTH * zoom;
    const graphWidth = width - PADDING_X * 2;
    const graphHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;

    const timeToX = (ts: number) =>
      PADDING_X + ((ts - dayStartMs) / DAY_MS) * graphWidth;

    const raw = measurements
      .filter((m) => m.measured_value != null)
      .map((m) => {
        const ts = new Date(m.measured_at).getTime();
        return {
          ts,
          value: m.measured_value as number,
          timeLabel: formatTimeWarsaw(ts, locale),
          dateTimeLabel: formatDateTimeWarsaw(ts, locale),
        };
      })
      .sort((a, b) => a.ts - b.ts);

    if (!raw.length) {
      return { width, points: [] as ChartPoint[], pathD: "" };
    }

    const min = Math.min(...raw.map((p) => p.value));
    const max = Math.max(...raw.map((p) => p.value));
    const padding = Math.max((max - min) * 0.1, 1);

    const range = Math.max(max - min + padding * 2, 1);

    const points: ChartPoint[] = raw.map((p) => ({
      x: timeToX(p.ts),
      y:
        PADDING_TOP +
        (1 - (p.value - (min - padding)) / range) * graphHeight,
      value: p.value,
      timeLabel: p.timeLabel,
      dateTimeLabel: p.dateTimeLabel,
    }));

    const pathD = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");

    return { width, points, pathD };
  }, [measurements, locale, zoom, dayStartMs]);

  const ticks = [0, 6, 12, 18, 24];

  return (
    <Box sx={{ borderRadius: 2, border: "1px solid rgba(15,139,111,0.18)", p: 2 }}>
      <Stack direction="row" justifyContent="space-between" mb={1}>
        <Typography fontWeight={700}  color="text.secondary">{resolvedDayLabel}</Typography>
        <Stack direction="row" spacing={1}>
          <IconButton onClick={() => setZoom((z) => Math.max(z - 1, MIN_ZOOM))}>
            <ZoomOutIcon />
          </IconButton>
          <Typography>{zoom.toFixed(1)}x</Typography>
          <IconButton onClick={() => setZoom((z) => Math.min(z + 1, MAX_ZOOM))}>
            <ZoomInIcon />
          </IconButton>
        </Stack>
      </Stack>

      <Box sx={{ overflowX: "auto" }}>
        <svg width={chart.width} height={HEIGHT}>
          {ticks.map((h) => {
            const ts = dayStartMs + (h / 24) * DAY_MS;
            const x =
              PADDING_X +
              ((ts - dayStartMs) / DAY_MS) *
                (chart.width - PADDING_X * 2);
            return (
              <g key={h}>
                <line
                  x1={x}
                  y1={PADDING_TOP}
                  x2={x}
                  y2={HEIGHT - PADDING_BOTTOM}
                  stroke="#ddd"
                />
                <text x={x} y={HEIGHT - 8} fontSize={11} textAnchor="middle">
                  {`${String(h).padStart(2, "0")}:00`}
                </text>
              </g>
            );
          })}

          {chart.pathD && (
            <path d={chart.pathD} fill="none" stroke="#12b886" strokeWidth={3} />
          )}

          {chart.points.map((p, i) => (
            <Tooltip
              key={i}
              arrow
              placement="top"
              title={
                <Stack spacing={0.25}>
                  <Typography variant="caption" fontWeight={700}>
                    {p.timeLabel} (Warsaw)
                  </Typography>
                  <Typography variant="caption">
                    {unit ? `${p.value} ${unit}` : p.value}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.8 }}>
                    {p.dateTimeLabel}
                  </Typography>
                </Stack>
              }
            >
              <g className="chart-point">
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={10}
                  fill="transparent"
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r={4}
                  fill="#12b886"
                />
              </g>
            </Tooltip>
          ))}
        </svg>
      </Box>

      {!chart.points.length && (
        <Box textAlign="center" mt={2}>
          <Typography variant="body2" color="text.secondary">
            {noDataLabel}
          </Typography>
        </Box>
      )}
    </Box>
  );
}
