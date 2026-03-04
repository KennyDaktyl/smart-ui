import { Box, Slider, Stack, TextField, Typography } from "@mui/material";

export type DeviceThresholdControlProps = {
  value: number;
  min: number;
  max: number;
  unit?: string | null;
  label?: string;
  step?: number;
  disabled?: boolean;
  onChange: (value: number) => void;
};

export function DeviceThresholdControl({
  value,
  min,
  max,
  unit,
  label,
  step = 1,
  disabled,
  onChange,
}: DeviceThresholdControlProps) {
  const clamp = (val: number) => Math.min(max, Math.max(min, val));

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} alignItems="center">
        <Typography variant="body2" color="text.secondary">
          {min} {unit ?? ""}
        </Typography>
        <Box flex={1}>
          <Slider
            value={value}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            onChange={(_, next) => {
              const nextValue = Array.isArray(next) ? next[0] : next;
              onChange(clamp(Number(nextValue)));
            }}
          />
        </Box>
        <Typography variant="body2" color="text.secondary">
          {max} {unit ?? ""}
        </Typography>
      </Stack>

      <TextField
        label={label}
        type="number"
        size="small"
        value={value}
        disabled={disabled}
        onChange={(event) => {
          const nextValue = Number(event.target.value);
          if (Number.isNaN(nextValue)) return;
          onChange(clamp(nextValue));
        }}
        inputProps={{ min, max, step }}
        fullWidth
        sx={{
          "& .MuiOutlinedInput-root": {
            backgroundColor: "#ffffff",
            color: "#111827",
            "& fieldset": {
              borderColor: "#d1d5db",
            },
            "&:hover fieldset": {
              borderColor: "#9ca3af",
            },
            "&.Mui-focused fieldset": {
              borderColor: "#2563eb",
              borderWidth: 2,
            },
          },
          "& .MuiInputLabel-root": {
            color: "#374151",
            backgroundColor: "#ffffff",
            padding: "0 4px",
          },
          "& .MuiInputLabel-root.Mui-focused": {
            color: "#2563eb",
          },
          "& .MuiInputLabel-root.MuiInputLabel-shrink": {
            color: "#374151",
          },
        }}
      />
    </Stack>
  );
}
