import { Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

const formatPower = (value: number | null, unit: string | null | undefined) => {
  if (value == null || Number.isNaN(value)) return "--";
  return `${value.toFixed(2)} ${unit ?? ""}`.trim();
};

type ProviderPowerGaugeProps = {
  power: number | null;
  unit?: string | null;
  min: number;
  max: number;
  isOn: boolean | null;
  onLabel: string;
  offLabel: string;
  pendingLabel: string;
  noDataLabel: string;
  rangeLabel: string;
};

export function ProviderPowerGauge({
  power,
  unit,
  min,
  max,
  isOn,
  onLabel,
  offLabel,
  pendingLabel,
  noDataLabel,
  rangeLabel,
}: ProviderPowerGaugeProps) {
  const theme = useTheme();

  const gaugeMin = Number.isFinite(min) ? min : 0;
  const gaugeMax = Number.isFinite(max) && max > gaugeMin ? max : gaugeMin + 1;
  const gaugeRange = gaugeMax - gaugeMin;

  const normalizedPower =
    power != null && Number.isFinite(power) ? Number(power) : null;

  const ratio =
    normalizedPower == null
      ? 0
      : clamp((normalizedPower - gaugeMin) / gaugeRange, 0, 1);

  const progressColor =
    ratio <= 0.33
      ? theme.palette.success.main
      : ratio <= 0.66
        ? theme.palette.warning.main
        : theme.palette.error.main;

  const stateLabel =
    isOn == null ? pendingLabel : isOn ? onLabel : offLabel;

  const stateColor =
    isOn == null
      ? theme.palette.text.secondary
      : isOn
        ? theme.palette.success.main
        : theme.palette.error.main;

  const stateBackground =
    isOn == null
      ? alpha(theme.palette.text.secondary, 0.12)
      : isOn
        ? alpha(theme.palette.success.main, 0.16)
        : alpha(theme.palette.error.main, 0.16);

  const size = 178;
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - ratio);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 1 }}>
      <Box sx={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={alpha(theme.palette.primary.main, 0.18)}
            strokeWidth={strokeWidth}
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={progressColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            style={{ transition: "stroke-dashoffset 260ms ease, stroke 260ms ease" }}
          />
        </svg>

        <Box
          sx={{
            position: "absolute",
            inset: 26,
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

      <Typography variant="caption" color="text.secondary">
        {rangeLabel}
      </Typography>
    </Box>
  );
}
