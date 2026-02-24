import { Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const formatPower = (value: number | null, unit: string | null | undefined) => {
  if (value == null || Number.isNaN(value)) return "--";
  return `${value.toFixed(2)} ${unit ?? ""}`.trim();
};

const formatScaleValue = (value: number) =>
  Number(value.toFixed(2)).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

type ProviderPowerGaugeProps = {
  power: number | null;
  unit?: string | null;
  min: number;
  max: number;
  threshold?: number | null;
  isOn: boolean | null;
  onLabel: string;
  offLabel: string;
  pendingLabel: string;
  noDataLabel: string;
  powerLabel?: string;
  thresholdLabel?: string;
  rangeLabel?: string;
};

export function ProviderPowerGauge({
  power,
  unit,
  min,
  max,
  threshold,
  isOn,
  onLabel,
  offLabel,
  pendingLabel,
  noDataLabel,
  powerLabel,
  thresholdLabel,
  rangeLabel,
}: ProviderPowerGaugeProps) {
  const theme = useTheme();

  const gaugeMin = Number.isFinite(min) ? min : 0;
  const gaugeMax = Number.isFinite(max) && max > gaugeMin ? max : gaugeMin + 1;
  const gaugeRange = gaugeMax - gaugeMin;

  const normalizedPower =
    power != null && Number.isFinite(power) ? Number(power) : null;
  const normalizedThreshold =
    threshold != null && Number.isFinite(threshold)
      ? clamp(Number(threshold), gaugeMin, gaugeMax)
      : null;

  const ratio =
    normalizedPower == null
      ? 0
      : clamp((normalizedPower - gaugeMin) / gaugeRange, 0, 1);
  const thresholdRatio =
    normalizedThreshold == null
      ? null
      : clamp((normalizedThreshold - gaugeMin) / gaugeRange, 0, 1);

  const missingToThreshold =
    normalizedPower != null && normalizedThreshold != null
      ? Math.max(normalizedThreshold - normalizedPower, 0)
      : 0;
  const deficitRatio =
    normalizedThreshold != null && normalizedThreshold !== 0
      ? clamp(missingToThreshold / Math.abs(normalizedThreshold), 0, 1)
      : 0;
  const surplusRatio =
    normalizedPower != null && normalizedThreshold != null
      ? clamp(
          Math.max(normalizedPower - normalizedThreshold, 0) /
            Math.max(gaugeMax - normalizedThreshold, 1),
          0,
          1
        )
      : normalizedPower != null
        ? ratio
        : 0;

  const progressColor =
    normalizedPower == null
      ? theme.palette.grey[400]
      : normalizedThreshold != null && normalizedPower < normalizedThreshold
        ? deficitRatio > 0.5
          ? "#d84315"
          : "#ef6c00"
        : normalizedThreshold == null
          ? ratio <= 0.3
            ? "#d94f2a"
            : ratio <= 0.6
              ? "#e49a38"
              : "#2e8b57"
        : surplusRatio > 0.7
          ? "#1b9e5a"
          : "#49a35c";

  const stateLabel =
    isOn == null ? pendingLabel : isOn ? onLabel : offLabel;

  const stateColor =
    normalizedPower == null
      ? isOn == null
        ? theme.palette.text.secondary
        : isOn
          ? theme.palette.success.main
          : theme.palette.error.main
      : progressColor;

  const stateBackground =
    normalizedPower == null
      ? alpha(theme.palette.text.secondary, 0.12)
      : alpha(progressColor, 0.14);

  const size = 192;
  const strokeWidth = 13;
  const radius = (size - strokeWidth) / 2 - 7;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const arcSpanDeg = 270;
  const arcStartDeg = 135;
  const arcLength = (circumference * arcSpanDeg) / 360;
  const trackDasharray = `${arcLength} ${circumference}`;
  const progressDasharray = `${arcLength * ratio} ${circumference}`;
  const pointOnCircle = (angleDeg: number, extraRadius = 0) => {
    const r = radius + extraRadius;
    const angleRad = (angleDeg * Math.PI) / 180;
    return {
      x: center + r * Math.cos(angleRad),
      y: center + r * Math.sin(angleRad),
    };
  };
  const thresholdAngle =
    thresholdRatio == null ? null : arcStartDeg + arcSpanDeg * thresholdRatio;
  const powerAngle = arcStartDeg + arcSpanDeg * ratio;
  const scaleTickCount = 5;
  const scaleStep = (gaugeMax - gaugeMin) / scaleTickCount;
  const tickAngles = Array.from(
    { length: scaleTickCount + 1 },
    (_, index) => arcStartDeg + (arcSpanDeg * index) / scaleTickCount
  );
  const tickValues = Array.from(
    { length: scaleTickCount + 1 },
    (_, index) => gaugeMin + scaleStep * index
  );
  const powerPoint = pointOnCircle(powerAngle, 0);
  const thresholdInnerPoint =
    thresholdAngle == null ? null : pointOnCircle(thresholdAngle, -strokeWidth / 2 - 2);
  const thresholdOuterPoint =
    thresholdAngle == null ? null : pointOnCircle(thresholdAngle, strokeWidth / 2 + 7);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 0.75 }}>
      <Box sx={{ position: "relative", width: size, height: size, mt: 0.25 }}>
        <svg width={size} height={size} style={{ overflow: "visible", display: "block" }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={alpha(theme.palette.primary.main, 0.18)}
            strokeWidth={strokeWidth}
            strokeDasharray={trackDasharray}
            transform={`rotate(${arcStartDeg} ${center} ${center})`}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={progressColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={progressDasharray}
            transform={`rotate(${arcStartDeg} ${center} ${center})`}
            style={{ transition: "stroke-dasharray 260ms ease, stroke 260ms ease" }}
          />

          {tickAngles.map((angle, index) => {
            const inner = pointOnCircle(angle, strokeWidth / 2 + 3);
            const outer = pointOnCircle(angle, strokeWidth / 2 + 7);
            return (
              <line
                key={`tick-${index}`}
                x1={inner.x}
                y1={inner.y}
                x2={outer.x}
                y2={outer.y}
                stroke={alpha(theme.palette.text.primary, 0.4)}
                strokeWidth={1}
                strokeLinecap="round"
              />
            );
          })}

          {tickAngles.map((angle, index) => {
            const labelPoint = pointOnCircle(angle, strokeWidth / 2 + 16);
            return (
              <text
                key={`tick-label-${index}`}
                x={labelPoint.x}
                y={labelPoint.y}
                textAnchor="middle"
                dominantBaseline="middle"
                style={{
                  fill: alpha(theme.palette.text.primary, 0.62),
                  fontSize: "9px",
                  fontWeight: 500,
                }}
              >
                {formatScaleValue(tickValues[index])}
              </text>
            );
          })}

          {thresholdInnerPoint && thresholdOuterPoint && (
            <line
              x1={thresholdInnerPoint.x}
              y1={thresholdInnerPoint.y}
              x2={thresholdOuterPoint.x}
              y2={thresholdOuterPoint.y}
              stroke={alpha(theme.palette.warning.dark, 0.95)}
              strokeWidth={3}
              strokeLinecap="round"
            />
          )}

          {normalizedPower != null && (
            <circle
              cx={powerPoint.x}
              cy={powerPoint.y}
              r={5.5}
              fill={progressColor}
              stroke={theme.palette.common.white}
              strokeWidth={2}
            />
          )}

        </svg>

        <Box
          sx={{
            position: "absolute",
            inset: 34,
            borderRadius: "50%",
            background: stateBackground,
            border: `1px solid ${alpha(stateColor, 0.35)}`,
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            textAlign: "center",
            px: 1,
          }}
        >
          <Typography variant="h5" fontWeight={800} sx={{ color: stateColor, lineHeight: 1 }}>
            {stateLabel}
          </Typography>
          <Typography variant="caption" sx={{ color: "text.secondary", mt: 0.5 }}>
            {normalizedPower == null ? noDataLabel : formatPower(normalizedPower, unit)}
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          width: size,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 0.25,
          mt: -0.15,
        }}
      >
        <Typography
          variant="caption"
          sx={{ color: alpha(theme.palette.text.primary, 0.76), fontWeight: 600 }}
        >
          {`${gaugeMin.toFixed(1)} ${unit ?? ""}`.trim()}
        </Typography>
        <Typography
          variant="caption"
          sx={{ color: alpha(theme.palette.text.primary, 0.76), fontWeight: 600 }}
        >
          {`${gaugeMax.toFixed(1)} ${unit ?? ""}`.trim()}
        </Typography>
      </Box>

      {normalizedThreshold != null && (
        <Typography
          variant="caption"
          sx={{ color: alpha(theme.palette.warning.dark, 0.95), lineHeight: 1.2 }}
        >
          {`${thresholdLabel ?? "Threshold"}: ${normalizedThreshold.toFixed(2)} ${
            unit ?? ""
          }`.trim()}
        </Typography>
      )}

      {normalizedPower != null && (
        <Typography variant="caption" color="text.secondary">
          {`${powerLabel ?? "Power"}: ${formatPower(normalizedPower, unit)}`}
        </Typography>
      )}

      {rangeLabel && (
        <Typography variant="caption" color="text.secondary">
          {rangeLabel}
        </Typography>
      )}
    </Box>
  );
}
