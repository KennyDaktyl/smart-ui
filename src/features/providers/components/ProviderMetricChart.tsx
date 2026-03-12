import ZoomInIcon from "@mui/icons-material/ZoomIn";
import ZoomOutIcon from "@mui/icons-material/ZoomOut";
import { Box, IconButton, Stack, Typography } from "@mui/material";
import { type MouseEvent, type ReactNode, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";

import type {
  ProviderMetricSeries,
  TelemetryChartType,
} from "@/features/providers/types/userProvider";

const BASE_WIDTH = 960;
const CHART_HEIGHT = 260;
const Y_AXIS_WIDTH = 58;
const PADDING_LEFT = 60;
const PADDING_RIGHT = 20;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 42;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const WARSAW_TZ = "Europe/Warsaw";
const BATTERY_SOC_TICKS = [0, 25, 50, 75, 100];
const MIN_ZOOM = 1;
const MAX_ZOOM = 6;
const ZOOM_STEP = 0.5;

type ChartPoint = {
  ts: number;
  value: number;
  x: number;
  y: number;
  label: string;
};

type HoverTooltipState = {
  top: number;
  left: number;
  value: number;
  dateTimeLabel: string;
  unit: string;
};

type StickyYAxisProps = {
  ticks: number[];
  yFor: (value: number) => number;
  height: number;
  isPercentAxis: boolean;
};

type ProviderMetricChartProps = {
  title: ReactNode;
  series: ProviderMetricSeries | null;
  noDataLabel: string;
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const formatValue = (value: number) => {
  const abs = Math.abs(value);
  if (abs < 1) return value.toFixed(3);
  if (abs < 10) return value.toFixed(2);
  if (abs < 100) return value.toFixed(1);
  return value.toFixed(0);
};

const formatAxisLabel = (value: number, isPercentAxis: boolean) =>
  isPercentAxis ? `${Math.round(value)}%` : formatValue(value);

const formatTooltipValue = (value: number, unit: string) => {
  if (unit === "%") {
    return `${Math.round(value)} ${unit}`.trim();
  }
  return `${formatValue(value)} ${unit}`.trim();
};

const formatTimeWarsaw = (ts: number) =>
  new Intl.DateTimeFormat("pl-PL", {
    timeZone: WARSAW_TZ,
    hour: "2-digit",
    minute: "2-digit",
  }).format(ts);

const formatDateTimeWarsaw = (ts: number) =>
  new Intl.DateTimeFormat("pl-PL", {
    timeZone: WARSAW_TZ,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(ts);

const buildLinePath = (points: ChartPoint[]) =>
  points
    .map((point, index) =>
      `${index === 0 ? "M" : "L"} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`
    )
    .join(" ");

const buildTicks = (min: number, max: number) => {
  if (Math.abs(max - min) < 1e-9) return [min];
  return Array.from({ length: 5 }, (_, index) => {
    const ratio = index / 4;
    return min + (max - min) * ratio;
  });
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

const buildGeometry = (
  width: number,
  dayStartMs: number,
  min: number,
  max: number,
  yTicksOverride?: number[]
) => {
  const graphWidth = width - PADDING_LEFT - PADDING_RIGHT;
  const graphHeight = CHART_HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const safeRange = Math.abs(max - min) < 1e-9 ? 1 : max - min;

  const xFor = (ts: number) =>
    PADDING_LEFT +
    clamp((ts - dayStartMs) / DAY_MS, 0, 1) * graphWidth;

  const yFor = (value: number) =>
    PADDING_TOP +
    (1 - (clamp(value, min, max) - min) / safeRange) * graphHeight;

  return {
    min,
    max,
    xFor,
    yFor,
    yTicks: yTicksOverride ?? buildTicks(min, max),
    zeroY: yFor(0),
  };
};

const StickyYAxis = ({
  ticks,
  yFor,
  height,
  isPercentAxis,
}: StickyYAxisProps) => (
  <Box
    sx={{
      width: Y_AXIS_WIDTH,
      minWidth: Y_AXIS_WIDTH,
      flexShrink: 0,
      borderRight: "1px solid #eef2f7",
      bgcolor: "background.paper",
    }}
  >
    <svg width={Y_AXIS_WIDTH} height={height} style={{ display: "block" }}>
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
              {formatAxisLabel(value, isPercentAxis)}
            </text>
          </g>
        );
      })}
    </svg>
  </Box>
);

export function ProviderMetricChart({
  title,
  series,
  noDataLabel,
}: ProviderMetricChartProps) {
  const { t } = useTranslation();
  const [tooltip, setTooltip] = useState<HoverTooltipState | null>(null);
  const [zoom, setZoom] = useState(1);
  const unit = series?.unit ?? "";
  const isBatterySocChart =
    series?.metric_key === "battery_soc" || series?.unit === "%";
  const dayStartMs = useMemo(
    () => Date.parse(`${series?.date ?? "1970-01-01"}T00:00:00Z`),
    [series?.date]
  );
  const chartWidth = BASE_WIDTH * zoom;
  const xTickHours = useMemo(
    () => buildHourTicks(resolveTickStepHours(zoom)),
    [zoom]
  );

  const chart = useMemo(() => {
    if (!series) {
      return {
        chartType: "line" as TelemetryChartType,
        points: [] as ChartPoint[],
        path: "",
        barWidth: 0,
        geometry: buildGeometry(chartWidth, dayStartMs, 0, 1),
      };
    }

    const rawPoints =
      series.aggregation_mode === "hourly_integral"
        ? series.hours.map((point) => ({
            ts: Date.parse(point.hour),
            value: point.value,
          }))
        : series.entries.map((point) => ({
            ts: Date.parse(point.timestamp),
            value: point.value,
          }));

    const normalized = rawPoints
      .filter((point) => Number.isFinite(point.ts) && Number.isFinite(point.value))
      .map((point) => {
        const pointTs =
          series.aggregation_mode === "hourly_integral" ? point.ts + HOUR_MS / 2 : point.ts;
        return {
          ts: pointTs,
          value: point.value,
          label: formatDateTimeWarsaw(point.ts),
        };
      })
      .sort((left, right) => left.ts - right.ts);

    if (!normalized.length) {
      return {
        chartType: series.chart_type,
        points: [] as ChartPoint[],
        path: "",
        barWidth: 0,
        geometry: buildGeometry(chartWidth, dayStartMs, 0, 1),
      };
    }

    let min = Math.min(...normalized.map((point) => point.value));
    let max = Math.max(...normalized.map((point) => point.value));
    let yTicksOverride: number[] | undefined;

    if (isBatterySocChart) {
      min = 0;
      max = 100;
      yTicksOverride = BATTERY_SOC_TICKS;
    }

    if (series.chart_type === "bar") {
      min = Math.min(0, min);
      max = Math.max(0, max);
    }

    if (Math.abs(max - min) < 1e-9) {
      const delta = max === 0 ? 1 : Math.abs(max) * 0.1;
      min -= delta;
      max += delta;
    }

    const geometry = buildGeometry(
      chartWidth,
      dayStartMs,
      min,
      max,
      yTicksOverride
    );
    const points = normalized.map((point) => ({
      ...point,
      x: geometry.xFor(point.ts),
      y: geometry.yFor(point.value),
    }));

    return {
      chartType: series.chart_type,
      points,
      path: buildLinePath(points),
      barWidth:
        series.chart_type === "bar"
          ? Math.max(10, (chartWidth - PADDING_LEFT - PADDING_RIGHT) / 24 / 1.6)
          : 0,
      geometry,
    };
  }, [chartWidth, dayStartMs, isBatterySocChart, series]);

  const showTooltip = (
    event: MouseEvent<SVGGraphicsElement>,
    value: number,
    dateTimeLabel: string
  ) => {
    setTooltip({
      top: Math.round(event.clientY + 12),
      left: Math.round(event.clientX + 12),
      value,
      dateTimeLabel,
      unit,
    });
  };

  return (
    <Box sx={{ borderRadius: 2, border: "1px solid rgba(15,139,111,0.18)", p: 2 }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        mb={1.5}
      >
        <Stack spacing={0.5}>
          <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
            {title}
          </Typography>
          {series?.unit ? (
            <Typography variant="caption" color="text.secondary">
              {series.unit}
            </Typography>
          ) : null}
        </Stack>

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

      <Box sx={{ display: "flex", borderRadius: 1, overflow: "hidden" }}>
        <StickyYAxis
          ticks={chart.geometry.yTicks}
          yFor={chart.geometry.yFor}
          height={CHART_HEIGHT}
          isPercentAxis={isBatterySocChart}
        />
        <Box sx={{ overflowX: "auto", flex: 1 }} onMouseLeave={() => setTooltip(null)}>
          <svg width={chartWidth} height={CHART_HEIGHT} style={{ display: "block" }}>
          {chart.geometry.yTicks.map((value, index) => {
            const y = chart.geometry.yFor(value);
            return (
              <line
                key={`grid-${index}`}
                x1={PADDING_LEFT}
                x2={chartWidth - PADDING_RIGHT}
                y1={y}
                y2={y}
                stroke="#e5e7eb"
              />
            );
          })}

          {xTickHours.map((hour) => {
            const ts = dayStartMs + hour * HOUR_MS;
            const x = chart.geometry.xFor(ts);
            return (
              <g key={`tick-${hour}`}>
                <line
                  x1={x}
                  x2={x}
                  y1={PADDING_TOP}
                  y2={CHART_HEIGHT - PADDING_BOTTOM}
                  stroke="#eef2f7"
                />
                <text
                  x={x}
                  y={CHART_HEIGHT - 10}
                  fontSize={11}
                  textAnchor="middle"
                  fill="#6b7280"
                >
                  {formatTimeWarsaw(ts)}
                </text>
              </g>
            );
          })}

          {chart.chartType === "bar" ? (
            <>
              <line
                x1={PADDING_LEFT}
                x2={chartWidth - PADDING_RIGHT}
                y1={chart.geometry.zeroY}
                y2={chart.geometry.zeroY}
                stroke="#94a3b8"
                strokeDasharray="4 4"
              />
              {chart.points.map((point, index) => {
                const y = point.value >= 0 ? point.y : chart.geometry.zeroY;
                const height = Math.max(2, Math.abs(point.y - chart.geometry.zeroY));
                return (
                  <rect
                    key={`bar-${index}`}
                    x={point.x - chart.barWidth / 2}
                    y={y}
                    width={chart.barWidth}
                    height={height}
                    rx={2}
                    fill={point.value >= 0 ? "#22c55e" : "#ef4444"}
                    style={{ cursor: "pointer" }}
                    onMouseEnter={(event) =>
                      showTooltip(event, point.value, point.label)
                    }
                    onMouseMove={(event) =>
                      showTooltip(event, point.value, point.label)
                    }
                  />
                );
              })}
            </>
          ) : (
            <>
              {chart.points.length > 1 ? (
                <path
                  d={chart.path}
                  fill="none"
                  stroke="#0f8b6f"
                  strokeWidth={2}
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              ) : null}
              {chart.points.map((point, index) => (
                <g
                  key={`point-${index}`}
                  style={{ cursor: "pointer" }}
                  onMouseEnter={(event) =>
                    showTooltip(event, point.value, point.label)
                  }
                  onMouseMove={(event) =>
                    showTooltip(event, point.value, point.label)
                  }
                >
                  <circle cx={point.x} cy={point.y} r={7} fill="transparent" />
                  <circle cx={point.x} cy={point.y} r={2.5} fill="#0f8b6f" />
                </g>
              ))}
            </>
          )}
          </svg>
        </Box>
      </Box>

      {!chart.points.length ? (
        <Typography align="center" color="text.secondary" mt={1.5}>
          {noDataLabel}
        </Typography>
      ) : null}

      {tooltip ? (
        <Box
          sx={{
            position: "fixed",
            top: tooltip.top,
            left: tooltip.left,
            zIndex: 1500,
            pointerEvents: "none",
            px: 1,
            py: 0.75,
            borderRadius: 1,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            boxShadow: 3,
          }}
        >
          <Typography variant="caption" fontWeight={700} color="#000" display="block">
            {formatTooltipValue(tooltip.value, tooltip.unit)}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {tooltip.dateTimeLabel}
          </Typography>
        </Box>
      ) : null}
    </Box>
  );
}
