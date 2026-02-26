import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import { Box, IconButton, Popover, Stack, Typography } from "@mui/material";
import { type MouseEvent, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { DayEnergy } from "../types/userProvider";

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;

const MIN_ZOOM = 1;
const MAX_ZOOM = 6;
const ZOOM_STEP = 0.5;

const BASE_WIDTH = 960;
const BAR_HEIGHT = 280;
const LINE_HEIGHT = 280;
const Y_AXIS_WIDTH = 58;

const PADDING_LEFT = 14;
const PADDING_RIGHT = 20;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 44;

const WARSAW_TZ = "Europe/Warsaw";

export type TelemetryChartPoint = {
  timestamp: string;
  value: number;
};

type HourBar = {
  ts: number;
  value: number;
  x: number;
  y: number;
  height: number;
  labelY: number;
  timeLabel: string;
  dateTimeLabel: string;
};

type EntryPoint = {
  ts: number;
  value: number;
  x: number;
  y: number;
  timeLabel: string;
  dateTimeLabel: string;
};

type ChartGeometry = {
  width: number;
  graphWidth: number;
  min: number;
  max: number;
  yTicks: number[];
  zeroY: number;
  xFor: (ts: number) => number;
  yFor: (value: number) => number;
};

type HoverTooltipState = {
  top: number;
  left: number;
  value: number;
  timeLabel: string;
  dateTimeLabel: string;
};

type ProviderTelemetryChartProps = {
  day: DayEnergy;
  points: TelemetryChartPoint[];
  unit?: string | null;
  noDataLabel: string;
  noEntriesLabel?: string;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

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

const formatValue = (value: number) => {
  const abs = Math.abs(value);
  if (abs < 1) return value.toFixed(3);
  if (abs < 10) return value.toFixed(2);
  if (abs < 100) return value.toFixed(1);
  return value.toFixed(0);
};

const resolveTickStepHours = (zoom: number) => {
  if (zoom >= 3) return 1;
  if (zoom >= 2) return 2;
  return 4;
};

const buildHourTicks = (stepHours: number) => {
  const ticks: number[] = [];
  for (let hour = 0; hour <= 24; hour += stepHours) {
    ticks.push(hour);
  }
  if (ticks[ticks.length - 1] !== 24) {
    ticks.push(24);
  }
  return ticks;
};

const buildLinearTicks = (min: number, max: number, steps = 4) => {
  if (Math.abs(max - min) < 1e-9) return [min];
  return Array.from({ length: steps + 1 }, (_, index) => {
    const ratio = index / steps;
    return min + (max - min) * ratio;
  });
};

const buildGeometry = (
  width: number,
  height: number,
  min: number,
  max: number,
  dayStartMs: number
): ChartGeometry => {
  const graphWidth = width - PADDING_LEFT - PADDING_RIGHT;
  const graphHeight = height - PADDING_TOP - PADDING_BOTTOM;

  const safeRange = Math.abs(max - min) < 1e-9 ? 1 : max - min;

  const xFor = (ts: number) => {
    const ratio = clamp((ts - dayStartMs) / DAY_MS, 0, 1);
    return PADDING_LEFT + ratio * graphWidth;
  };

  const yFor = (value: number) =>
    PADDING_TOP + (1 - (value - min) / safeRange) * graphHeight;

  return {
    width,
    graphWidth,
    min,
    max,
    yTicks: buildLinearTicks(min, max, 4),
    zeroY: yFor(0),
    xFor,
    yFor,
  };
};

const buildLinePath = (points: EntryPoint[]) =>
  points
    .map((point, index) =>
      `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
    )
    .join(" ");

type StickyYAxisProps = {
  ticks: number[];
  yFor: (value: number) => number;
  height: number;
};

const StickyYAxis = ({ ticks, yFor, height }: StickyYAxisProps) => (
  <Box
    sx={{
      width: Y_AXIS_WIDTH,
      minWidth: Y_AXIS_WIDTH,
      flexShrink: 0,
      borderRight: "1px solid #eef2f7",
    }}
  >
    <svg width={Y_AXIS_WIDTH} height={height}>
      {ticks.map((value, index) => {
        const y = yFor(value);
        return (
          <g key={`axis-y-${index}`}>
            <line
              x1={Y_AXIS_WIDTH - 6}
              x2={Y_AXIS_WIDTH}
              y1={y}
              y2={y}
              stroke="#d1d5db"
            />
            <text
              x={Y_AXIS_WIDTH - 10}
              y={y + 4}
              fontSize={11}
              textAnchor="end"
              fill="#6b7280"
            >
              {formatValue(value)}
            </text>
          </g>
        );
      })}
    </svg>
  </Box>
);

export function ProviderTelemetryChart({
  day,
  points,
  unit = "kW",
  noDataLabel,
  noEntriesLabel,
}: ProviderTelemetryChartProps) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "pl" ? "pl-PL" : "en-US";
  const [zoom, setZoom] = useState(1);
  const [hoverTooltip, setHoverTooltip] = useState<HoverTooltipState | null>(
    null
  );

  const dayStartMs = useMemo(() => Date.parse(`${day.date}T00:00:00Z`), [day.date]);

  const chartWidth = BASE_WIDTH * zoom;
  const xTickHours = useMemo(
    () => buildHourTicks(resolveTickStepHours(zoom)),
    [zoom]
  );

  const barsChart = useMemo(() => {
    const hours = (day.hours ?? [])
      .map((point) => {
        const hourStartMs = Date.parse(point.hour);
        if (Number.isNaN(hourStartMs)) return null;
        return {
          ts: hourStartMs + HOUR_MS / 2,
          value: point.energy,
          timeLabel: formatTimeWarsaw(hourStartMs, locale),
          dateTimeLabel: formatDateTimeWarsaw(hourStartMs, locale),
        };
      })
      .filter((point): point is NonNullable<typeof point> => point != null)
      .sort((a, b) => a.ts - b.ts);

    if (!hours.length) {
      return {
        bars: [] as HourBar[],
        barWidth: 0,
        geometry: buildGeometry(chartWidth, BAR_HEIGHT, 0, 1, dayStartMs),
      };
    }

    const values = hours.map((point) => point.value);
    let min = Math.min(0, ...values);
    let max = Math.max(0, ...values);

    if (Math.abs(max - min) < 1e-9) {
      max += 1;
      min -= 1;
    }

    const geometry = buildGeometry(chartWidth, BAR_HEIGHT, min, max, dayStartMs);
    const barWidth = Math.max(8, (geometry.graphWidth / 24) * 0.66);

    const bars = hours.map((point) => {
      const x = geometry.xFor(point.ts);
      const valueY = geometry.yFor(point.value);
      const y = point.value >= 0 ? valueY : geometry.zeroY;
      const height = Math.max(2, Math.abs(valueY - geometry.zeroY));
      const labelY = point.value >= 0 ? y - 6 : y + height + 12;

      return {
        ...point,
        x,
        y,
        height,
        labelY,
      };
    });

    return {
      bars,
      barWidth,
      geometry,
    };
  }, [chartWidth, day.hours, dayStartMs, locale]);

  const entriesChart = useMemo(() => {
    const normalizedEntries = points
      .map((point) => {
        const ts = Date.parse(point.timestamp);
        if (!Number.isFinite(ts) || !Number.isFinite(point.value)) return null;
        return {
          ts,
          value: point.value,
          timeLabel: formatTimeWarsaw(ts, locale),
          dateTimeLabel: formatDateTimeWarsaw(ts, locale),
        };
      })
      .filter((point): point is NonNullable<typeof point> => point != null)
      .sort((a, b) => a.ts - b.ts);

    if (!normalizedEntries.length) {
      return {
        points: [] as EntryPoint[],
        path: "",
        geometry: buildGeometry(chartWidth, LINE_HEIGHT, 0, 1, dayStartMs),
      };
    }

    const values = normalizedEntries.map((entry) => entry.value);
    let min = Math.min(...values);
    let max = Math.max(...values);

    if (min > 0) min = 0;

    if (Math.abs(max - min) < 1e-9) {
      const delta = max === 0 ? 1 : Math.abs(max) * 0.1;
      min -= delta;
      max += delta;
    }

    const geometry = buildGeometry(chartWidth, LINE_HEIGHT, min, max, dayStartMs);
    const linePoints = normalizedEntries.map((entry) => ({
      ...entry,
      x: geometry.xFor(entry.ts),
      y: geometry.yFor(entry.value),
    }));

    return {
      points: linePoints,
      path: buildLinePath(linePoints),
      geometry,
    };
  }, [chartWidth, dayStartMs, locale, points]);

  const unitLabel = unit ?? "kW";
  const totalEnergy = day.total_energy ?? 0;
  const importEnergy = day.import_energy ?? 0;
  const exportEnergy = day.export_energy ?? 0;

  const showTooltip = (
    event: MouseEvent<SVGGraphicsElement>,
    value: number,
    timeLabel: string,
    dateTimeLabel: string
  ) => {
    setHoverTooltip({
      top: Math.round(event.clientY + 12),
      left: Math.round(event.clientX + 12),
      value,
      timeLabel,
      dateTimeLabel,
    });
  };

  const hideTooltip = () => setHoverTooltip(null);

  return (
    <Box sx={{ borderRadius: 2, border: "1px solid rgba(15,139,111,0.18)", p: 2 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        justifyContent="space-between"
        mb={1}
      >
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
          <IconButton
            size="small"
            onClick={() => setZoom((value) => Math.max(value - ZOOM_STEP, MIN_ZOOM))}
            disabled={zoom <= MIN_ZOOM}
          >
            <ZoomOutIcon fontSize="small" />
          </IconButton>
          <Typography color="primary" minWidth={40} textAlign="center">
            {zoom.toFixed(1)}x
          </Typography>
          <IconButton
            size="small"
            onClick={() => setZoom((value) => Math.min(value + ZOOM_STEP, MAX_ZOOM))}
            disabled={zoom >= MAX_ZOOM}
          >
            <ZoomInIcon fontSize="small" />
          </IconButton>
        </Stack>
      </Stack>

      <Stack direction="row" spacing={3} mb={1} flexWrap="wrap">
        <Typography color="success.main">
          +{formatValue(exportEnergy)} {unitLabel}
        </Typography>
        <Typography color="error.main">
          -{formatValue(importEnergy)} {unitLabel}
        </Typography>
        <Typography fontWeight={700} color="primary">
          Σ {formatValue(totalEnergy)} {unitLabel}
        </Typography>
      </Stack>

      <Typography variant="subtitle2" fontWeight={700} mb={1} color="text.secondary">
        {t("providers.telemetry.hourlyChart")}
      </Typography>

      <Box sx={{ display: "flex", borderRadius: 1, overflow: "hidden" }}>
        <StickyYAxis
          ticks={barsChart.geometry.yTicks}
          yFor={barsChart.geometry.yFor}
          height={BAR_HEIGHT}
        />
        <Box sx={{ overflowX: "auto", flex: 1 }} onMouseLeave={hideTooltip}>
          <svg width={barsChart.geometry.width} height={BAR_HEIGHT}>
            {barsChart.geometry.yTicks.map((value, index) => {
              const y = barsChart.geometry.yFor(value);
              return (
                <line
                  key={`bar-y-${index}`}
                  x1={PADDING_LEFT}
                  x2={barsChart.geometry.width - PADDING_RIGHT}
                  y1={y}
                  y2={y}
                  stroke="#e5e7eb"
                />
              );
            })}

            {xTickHours.map((hour) => {
              const ts = dayStartMs + hour * HOUR_MS;
              const x = barsChart.geometry.xFor(ts);
              return (
                <g key={`bar-x-${hour}`}>
                  <line
                    x1={x}
                    y1={PADDING_TOP}
                    x2={x}
                    y2={BAR_HEIGHT - PADDING_BOTTOM}
                    stroke="#eef2f7"
                  />
                  <text
                    x={x}
                    y={BAR_HEIGHT - 10}
                    fontSize={11}
                    textAnchor="middle"
                    fill="#6b7280"
                  >
                    {formatTimeWarsaw(ts, locale)}
                  </text>
                </g>
              );
            })}

            <line
              x1={PADDING_LEFT}
              x2={barsChart.geometry.width - PADDING_RIGHT}
              y1={barsChart.geometry.zeroY}
              y2={barsChart.geometry.zeroY}
              stroke="#94a3b8"
              strokeDasharray="4 4"
            />

            {barsChart.bars.map((bar, index) => (
              <g key={`bar-${index}`}>
                <rect
                  x={bar.x - barsChart.barWidth / 2}
                  y={bar.y}
                  width={barsChart.barWidth}
                  height={bar.height}
                  rx={2}
                  fill={bar.value >= 0 ? "#22c55e" : "#ef4444"}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(event) =>
                    showTooltip(event, bar.value, bar.timeLabel, bar.dateTimeLabel)
                  }
                  onMouseMove={(event) =>
                    showTooltip(event, bar.value, bar.timeLabel, bar.dateTimeLabel)
                  }
                  onMouseLeave={hideTooltip}
                />
                <text
                  x={bar.x}
                  y={bar.labelY}
                  fontSize={10}
                  textAnchor="middle"
                  fill="#0f172a"
                >
                  {formatValue(bar.value)}
                </text>
              </g>
            ))}
          </svg>
        </Box>
      </Box>

      {!barsChart.bars.length && (
        <Typography align="center" color="text.secondary" mt={1.5}>
          {noDataLabel}
        </Typography>
      )}

      <Typography
        variant="subtitle2"
        fontWeight={700}
        mt={2.5}
        mb={1}
        color="text.secondary"
      >
        {t("providers.telemetry.entriesChart")}
      </Typography>

      <Box sx={{ display: "flex", borderRadius: 1, overflow: "hidden" }}>
        <StickyYAxis
          ticks={entriesChart.geometry.yTicks}
          yFor={entriesChart.geometry.yFor}
          height={LINE_HEIGHT}
        />
        <Box sx={{ overflowX: "auto", flex: 1 }} onMouseLeave={hideTooltip}>
          <svg width={entriesChart.geometry.width} height={LINE_HEIGHT}>
            {entriesChart.geometry.yTicks.map((value, index) => {
              const y = entriesChart.geometry.yFor(value);
              return (
                <line
                  key={`line-y-${index}`}
                  x1={PADDING_LEFT}
                  x2={entriesChart.geometry.width - PADDING_RIGHT}
                  y1={y}
                  y2={y}
                  stroke="#e5e7eb"
                />
              );
            })}

            {xTickHours.map((hour) => {
              const ts = dayStartMs + hour * HOUR_MS;
              const x = entriesChart.geometry.xFor(ts);
              return (
                <g key={`line-x-${hour}`}>
                  <line
                    x1={x}
                    y1={PADDING_TOP}
                    x2={x}
                    y2={LINE_HEIGHT - PADDING_BOTTOM}
                    stroke="#eef2f7"
                  />
                  <text
                    x={x}
                    y={LINE_HEIGHT - 10}
                    fontSize={11}
                    textAnchor="middle"
                    fill="#6b7280"
                  >
                    {formatTimeWarsaw(ts, locale)}
                  </text>
                </g>
              );
            })}

            {entriesChart.points.length > 1 && (
              <path
                d={entriesChart.path}
                fill="none"
                stroke="#0f8b6f"
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )}

            {entriesChart.points.map((point, index) => (
              <g
                key={`entry-point-${index}`}
                style={{ cursor: "pointer" }}
                onMouseEnter={(event) =>
                  showTooltip(event, point.value, point.timeLabel, point.dateTimeLabel)
                }
                onMouseMove={(event) =>
                  showTooltip(event, point.value, point.timeLabel, point.dateTimeLabel)
                }
                onMouseLeave={hideTooltip}
              >
                <circle cx={point.x} cy={point.y} r={8} fill="transparent" />
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={zoom >= 3 ? 2.2 : 1.8}
                  fill="#0f8b6f"
                />
              </g>
            ))}
          </svg>
        </Box>
      </Box>

      {!entriesChart.points.length && (
        <Typography align="center" color="text.secondary" mt={1.5}>
          {noEntriesLabel ?? noDataLabel}
        </Typography>
      )}

      <Typography variant="caption" color="text.secondary" mt={1.5} display="block">
        {unitLabel}
      </Typography>

      <Popover
        open={hoverTooltip != null}
        anchorReference="anchorPosition"
        anchorPosition={
          hoverTooltip
            ? { top: hoverTooltip.top, left: hoverTooltip.left }
            : undefined
        }
        onClose={hideTooltip}
        disableRestoreFocus
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{
          paper: {
            sx: {
              pointerEvents: "none",
              px: 1,
              py: 0.75,
              borderRadius: 1,
            },
          },
        }}
      >
        <Typography variant="caption" fontWeight={700} display="block">
          {hoverTooltip ? `${formatValue(hoverTooltip.value)} ${unitLabel}` : ""}
        </Typography>
        <Typography variant="caption" color="text.secondary" display="block">
          {hoverTooltip?.dateTimeLabel ?? ""}
        </Typography>
      </Popover>
    </Box>
  );
}
