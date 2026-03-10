import { Box, Stack, Typography } from "@mui/material";
import { type MouseEvent, useMemo, useState } from "react";

import type {
  ProviderMetricSeries,
  TelemetryChartType,
} from "@/features/providers/types/userProvider";

const CHART_WIDTH = 960;
const CHART_HEIGHT = 260;
const PADDING_LEFT = 16;
const PADDING_RIGHT = 20;
const PADDING_TOP = 20;
const PADDING_BOTTOM = 42;
const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;
const WARSAW_TZ = "Europe/Warsaw";

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

type ProviderMetricChartProps = {
  title: string;
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

const buildGeometry = (dayStartMs: number, min: number, max: number) => {
  const graphWidth = CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT;
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
    yTicks: buildTicks(min, max),
    zeroY: yFor(0),
  };
};

export function ProviderMetricChart({
  title,
  series,
  noDataLabel,
}: ProviderMetricChartProps) {
  const [tooltip, setTooltip] = useState<HoverTooltipState | null>(null);
  const unit = series?.unit ?? "";
  const dayStartMs = useMemo(
    () => Date.parse(`${series?.date ?? "1970-01-01"}T00:00:00Z`),
    [series?.date]
  );

  const chart = useMemo(() => {
    if (!series) {
      return {
        chartType: "line" as TelemetryChartType,
        points: [] as ChartPoint[],
        path: "",
        barWidth: 0,
        geometry: buildGeometry(dayStartMs, 0, 1),
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
        geometry: buildGeometry(dayStartMs, 0, 1),
      };
    }

    let min = Math.min(...normalized.map((point) => point.value));
    let max = Math.max(...normalized.map((point) => point.value));

    if (series.chart_type === "bar") {
      min = Math.min(0, min);
      max = Math.max(0, max);
    }

    if (Math.abs(max - min) < 1e-9) {
      const delta = max === 0 ? 1 : Math.abs(max) * 0.1;
      min -= delta;
      max += delta;
    }

    const geometry = buildGeometry(dayStartMs, min, max);
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
          ? Math.max(10, (CHART_WIDTH - PADDING_LEFT - PADDING_RIGHT) / 24 / 1.6)
          : 0,
      geometry,
    };
  }, [dayStartMs, series]);

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
      <Stack spacing={0.5} mb={1.5}>
        <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
          {title}
        </Typography>
        {series?.unit ? (
          <Typography variant="caption" color="text.secondary">
            {series.unit}
          </Typography>
        ) : null}
      </Stack>

      <Box sx={{ overflowX: "auto" }} onMouseLeave={() => setTooltip(null)}>
        <svg width={CHART_WIDTH} height={CHART_HEIGHT}>
          {chart.geometry.yTicks.map((value, index) => {
            const y = chart.geometry.yFor(value);
            return (
              <g key={`grid-${index}`}>
                <line
                  x1={PADDING_LEFT}
                  x2={CHART_WIDTH - PADDING_RIGHT}
                  y1={y}
                  y2={y}
                  stroke="#e5e7eb"
                />
                <text
                  x={PADDING_LEFT - 6}
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

          {Array.from({ length: 7 }, (_, index) => index * 4).map((hour) => {
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
                x2={CHART_WIDTH - PADDING_RIGHT}
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
            {`${formatValue(tooltip.value)} ${tooltip.unit}`.trim()}
          </Typography>
          <Typography variant="caption" color="text.secondary" display="block">
            {tooltip.dateTimeLabel}
          </Typography>
        </Box>
      ) : null}
    </Box>
  );
}
