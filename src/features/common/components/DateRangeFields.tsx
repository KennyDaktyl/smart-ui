import { Stack, TextField } from "@mui/material";

type DateRangeFieldsProps = {
  startLabel: string;
  endLabel: string;
  startValue: string;
  endValue: string;
  onChangeStart: (value: string) => void;
  onChangeEnd: (value: string) => void;
};

/**
 * Responsive pair of datetime inputs used for filtering telemetry ranges.
 */
export function DateRangeFields({
  startLabel,
  endLabel,
  startValue,
  endValue,
  onChangeStart,
  onChangeEnd,
}: DateRangeFieldsProps) {
  return (
    <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
      <TextField
        label={startLabel}
        type="datetime-local"
        size="small"
        fullWidth
        sx={{ flex: 1, minWidth: 0 }}
        value={startValue}
        onChange={(e) => onChangeStart(e.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
      />
      <TextField
        label={endLabel}
        type="datetime-local"
        size="small"
        fullWidth
        sx={{ flex: 1, minWidth: 0 }}
        value={endValue}
        onChange={(e) => onChangeEnd(e.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
      />
    </Stack>
  );
}
