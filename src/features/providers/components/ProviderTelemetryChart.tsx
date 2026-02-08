import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { DayEnergy } from "../types/userProvider";

/* ===================== CONSTANTS ===================== */

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

const MIN_ZOOM = 1;
const MAX_ZOOM = 24;

const BASE_WIDTH = 1000;
const HEIGHT = 260;

const PADDING_X = 64;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 44;

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

const formatEnergy = (value: number) => {
  const abs = Math.abs(value);
  if (abs < 1) return value.toFixed(2);
  if (abs < 10) return value.toFixed(2);
  if (abs < 100) return value.toFixed(1);
  return value.toFixed(0);
};

/* ===================== COMPONENT ===================== */

export function ProviderTelemetryChart({
  day,
  unit = "Wh",
  noDataLabel,
}: {
  day: DayEnergy;
  unit?: string | null;
  noDataLabel: string;
}) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "pl" ? "pl-PL" : "en-US";
  const [zoom, setZoom] = useState(1);

  // dzień liczony w UTC
  const dayStartMs = useMemo(
    () => Date.parse(`${day.date}T00:00:00Z`),
    [day.date]
  );

  const chart = useMemo(() => {
    const width = BASE_WIDTH * zoom;
    const graphWidth = width - PADDING_X * 2;
    const graphHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;

    const timeToX = (ts: number) =>
      PADDING_X + ((ts - dayStartMs) / DAY_MS) * graphWidth;

    const raw = day.hours
      .map((h) => {
        const hourStart = Date.parse(h.hour);
        const hourCenter = hourStart + HOUR_MS / 2;
        return {
          ts: hourCenter,
          value: h.energy,
          timeLabel: formatTimeWarsaw(hourStart, locale),
          dateTimeLabel: formatDateTimeWarsaw(hourStart, locale),
        };
      })
      .sort((a, b) => a.ts - b.ts);

    if (!raw.length) {
      return { width, bars: [], zeroY: null, yTicks: [] };
    }

    const minRaw = Math.min(...raw.map((p) => p.value));
    const maxRaw = Math.max(...raw.map((p) => p.value));
    const maxAbs = Math.max(Math.abs(minRaw), Math.abs(maxRaw), 0.5);

    const min = -maxAbs;
    const max = maxAbs;
    const range = max - min;

    const zeroY =
      PADDING_TOP + (1 - (0 - min) / range) * graphHeight;

    const yTicks = [-maxAbs, -maxAbs / 2, 0, maxAbs / 2, maxAbs];

    const barWidth = (graphWidth / 24) * 0.7;

    const bars = raw.map((p) => {
      const y =
        PADDING_TOP +
        (1 - (p.value - min) / range) * graphHeight;

      return {
        ...p,
        x: timeToX(p.ts),
        y,
        height: Math.max(Math.abs(y - zeroY), 2),
      };
    });

    return { width, bars, zeroY, yTicks };
  }, [day.hours, dayStartMs, locale, zoom]);

  const xTicks = [0, 6, 12, 18, 24];

  return (
    <Box sx={{ borderRadius: 2, border: "1px solid rgba(15,139,111,0.18)", p: 2 }}>
      {/* HEADER */}
      <Stack direction="row" justifyContent="space-between" mb={1}>
        <Typography fontWeight={700} color="text.secondary">
          {new Date(`${day.date}T00:00:00Z`).toLocaleDateString(locale, {
            year: "numeric",
            month: "long",
            day: "numeric",
            timeZone: WARSAW_TZ,
          })}
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="caption" color="primary">
            {t("providers.telemetry.zoom")}
          </Typography>
          <IconButton onClick={() => setZoom((z) => Math.max(z - 1, MIN_ZOOM))}>
            <ZoomOutIcon />
          </IconButton>
          <Typography color="primary">{zoom}x</Typography>
          <IconButton onClick={() => setZoom((z) => Math.min(z + 1, MAX_ZOOM))}>
            <ZoomInIcon />
          </IconButton>
        </Stack>
      </Stack>

      {/* SUMMARY */}
      <Stack direction="row" spacing={3} mb={1}>
        <Typography color="success.main">
          +{formatEnergy(day.export_energy)} {unit}
        </Typography>
        <Typography color="error.main">
          -{formatEnergy(day.import_energy)} {unit}
        </Typography>
        <Typography fontWeight={700} color="primary">
          Σ {formatEnergy(day.total_energy)} {unit}
        </Typography>
      </Stack>

      {/* SVG */}
      <Box sx={{ overflowX: "auto" }}>
        <svg width={chart.width} height={HEIGHT}>
          {/* Y AXIS */}
          {chart.yTicks.map((v, i) => {
            const y =
              PADDING_TOP +
              (1 - (v + chart.yTicks[chart.yTicks.length - 1]) /
                (chart.yTicks[chart.yTicks.length - 1] * 2)) *
                (HEIGHT - PADDING_TOP - PADDING_BOTTOM);

            return (
              <g key={i}>
                <line
                  x1={PADDING_X}
                  x2={chart.width - PADDING_X}
                  y1={y}
                  y2={y}
                  stroke="#e5e7eb"
                />
                <text
                  x={PADDING_X - 8}
                  y={y + 4}
                  fontSize={11}
                  textAnchor="end"
                  fill="#6b7280"
                >
                  {formatEnergy(v)}
                </text>
              </g>
            );
          })}

          {/* X AXIS */}
          {xTicks.map((h) => {
            const ts = dayStartMs + h * HOUR_MS;
            const x = PADDING_X + ((ts - dayStartMs) / DAY_MS) * (chart.width - PADDING_X * 2);
            return (
              <g key={h}>
                <line
                  x1={x}
                  y1={PADDING_TOP}
                  x2={x}
                  y2={HEIGHT - PADDING_BOTTOM}
                  stroke="#e5e7eb"
                />
                <text x={x} y={HEIGHT - 10} fontSize={11} textAnchor="middle">
                  {`${String(h).padStart(2, "0")}:00`}
                </text>
              </g>
            );
          })}

          {/* ZERO LINE */}
          {chart.zeroY != null && (
            <line
              x1={PADDING_X}
              x2={chart.width - PADDING_X}
              y1={chart.zeroY}
              y2={chart.zeroY}
              stroke="#ef4444"
              strokeDasharray="4 4"
            />
          )}

          {/* BARS */}
          {chart.bars.map((b, i) => (
            <Tooltip
              key={i}
              arrow
              placement="top"
              title={
                <Stack spacing={0.25}>
                  <Typography variant="caption" fontWeight={700}>
                    {b.timeLabel}
                  </Typography>
                  <Typography variant="caption">
                    {formatEnergy(b.value)} {unit} / h
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    {b.dateTimeLabel}
                  </Typography>
                </Stack>
              }
            >
              <rect
                x={b.x - (chart.width / 24) * 0.35}
                y={b.value >= 0 ? b.y : chart.zeroY!}
                width={(chart.width / 24) * 0.7}
                height={b.height}
                rx={2}
                fill={b.value >= 0 ? "#22c55e" : "#ef4444"}
              />
            </Tooltip>
          ))}
        </svg>
      </Box>

      <Typography variant="caption" color="text.secondary" mt={1}>
        {unit} / h
      </Typography>

      {!chart.bars.length && (
        <Typography align="center" color="text.secondary" mt={2}>
          {noDataLabel}
        </Typography>
      )}
    </Box>
  );
}
