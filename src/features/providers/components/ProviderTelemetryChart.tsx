import { Box, IconButton, Stack, Tooltip, Typography } from "@mui/material";
import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { DayEnergy } from "@/features/providers/types/providerEnergy";

/* ===================== CONSTANTS ===================== */

const DAY_MS = 24 * 60 * 60 * 1000;
const MIN_ZOOM = 1;
const MAX_ZOOM = 24;

const BASE_WIDTH = 1000;
const HEIGHT = 260;

const PADDING_X = 56;
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
        const ts = new Date(h.hour).getTime();
        return {
          ts,
          value: h.energy_wh,
          timeLabel: formatTimeWarsaw(ts, locale),
          dateTimeLabel: formatDateTimeWarsaw(ts, locale),
        };
      })
      .sort((a, b) => a.ts - b.ts);

    if (!raw.length) {
      return { width, points: [], pathD: "", zeroY: null };
    }

    // ===== SYMETRIA WOKÓŁ 0 =====
    const minRaw = Math.min(...raw.map((p) => p.value));
    const maxRaw = Math.max(...raw.map((p) => p.value));
    const maxAbs = Math.max(Math.abs(minRaw), Math.abs(maxRaw), 1);

    const min = -maxAbs;
    const max = maxAbs;
    const range = max - min;

    const zeroY =
      PADDING_TOP + (1 - (0 - min) / range) * graphHeight;

    const points = raw.map((p) => ({
      x: timeToX(p.ts),
      y:
        PADDING_TOP +
        (1 - (p.value - min) / range) * graphHeight,
      ...p,
    }));

    const pathD = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
      .join(" ");

    return { width, points, pathD, zeroY };
  }, [day.hours, dayStartMs, locale, zoom]);

  const ticks = [0, 6, 12, 18, 24];

  return (
    <Box sx={{ borderRadius: 2, border: "1px solid rgba(15,139,111,0.18)", p: 2 }}>
      {/* ===== HEADER ===== */}
      <Stack direction="row" justifyContent="space-between" mb={1}>
        <Typography fontWeight={700} color="text.secondary">
          {new Date(`${day.date}T00:00:00Z`).toLocaleDateString(locale, {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="caption">{t("providers.telemetry.zoom")}</Typography>
          <IconButton onClick={() => setZoom((z) => Math.max(z - 1, MIN_ZOOM))}>
            <ZoomOutIcon />
          </IconButton>
          <Typography>{zoom}x</Typography>
          <IconButton onClick={() => setZoom((z) => Math.min(z + 1, MAX_ZOOM))}>
            <ZoomInIcon />
          </IconButton>
        </Stack>
      </Stack>

      {/* ===== SUMMARY ===== */}
      <Stack direction="row" spacing={3} mb={1}>
        <Typography color="success.main">
          +{day.export_wh.toFixed(1)} {unit}
        </Typography>
        <Typography color="error.main">
          -{day.import_wh.toFixed(1)} {unit}
        </Typography>
        <Typography fontWeight={700}>
          Σ {day.total_energy_wh.toFixed(1)} {unit}
        </Typography>
      </Stack>

      {/* ===== SVG ===== */}
      <Box sx={{ overflowX: "auto" }}>
        <svg width={chart.width} height={HEIGHT}>
          {/* GRID */}
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

          {/* PATH */}
          {chart.pathD && (
            <path d={chart.pathD} fill="none" stroke="#12b886" strokeWidth={3} />
          )}

          {/* POINTS */}
          {chart.points.map((p, i) => (
            <Tooltip
              key={i}
              arrow
              placement="top"
              title={
                <Stack spacing={0.25}>
                  <Typography variant="caption" fontWeight={700}>
                    {p.timeLabel}
                  </Typography>
                  <Typography variant="caption">
                    {p.value.toFixed(2)} {unit}
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.7 }}>
                    {p.dateTimeLabel}
                  </Typography>
                </Stack>
              }
            >
              <circle cx={p.x} cy={p.y} r={4} fill="#12b886" />
            </Tooltip>
          ))}
        </svg>
      </Box>

      {!chart.points.length && (
        <Typography align="center" color="text.secondary" mt={2}>
          {noDataLabel}
        </Typography>
      )}
    </Box>
  );
}
