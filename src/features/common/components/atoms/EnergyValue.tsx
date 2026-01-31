import { Typography } from "@mui/material";

export type EnergyValueProps = {
  value: number | null;
  unit?: string | null;
  precision?: number;
  fallback?: string;
};

export function EnergyValue({ value, unit, precision = 2, fallback = "--" }: EnergyValueProps) {
  if (value == null || Number.isNaN(value)) {
    return (
      <Typography variant="h6" fontWeight={700}>
        {fallback}
      </Typography>
    );
  }

  const formatted = precision != null ? value.toFixed(precision) : String(value);
  const label = [formatted, unit ?? ""].filter(Boolean).join(" ");

  return (
    <Typography variant="h6" fontWeight={700}>
      {label}
    </Typography>
  );
}
