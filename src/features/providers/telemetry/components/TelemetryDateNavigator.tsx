import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { Button, Stack, TextField } from "@mui/material";

type TelemetryDateNavigatorProps = {
  dateLabel: string;
  previousDayLabel: string;
  nextDayLabel: string;
  selectedDate: string;
  maxDate: string;
  nextDisabled: boolean;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onDateChange: (date: string) => void;
};

export function TelemetryDateNavigator({
  dateLabel,
  previousDayLabel,
  nextDayLabel,
  selectedDate,
  maxDate,
  nextDisabled,
  onPreviousDay,
  onNextDay,
  onDateChange,
}: TelemetryDateNavigatorProps) {
  return (
    <Stack
      direction={{ xs: "column", sm: "row" }}
      spacing={1.5}
      alignItems={{ xs: "stretch", sm: "center" }}
      justifyContent="space-between"
    >
      <Button
        variant="outlined"
        startIcon={<ChevronLeftIcon />}
        onClick={onPreviousDay}
        sx={{ textTransform: "none", alignSelf: { xs: "stretch", sm: "center" } }}
      >
        {previousDayLabel}
      </Button>

      <TextField
        label={dateLabel}
        type="date"
        size="small"
        value={selectedDate}
        inputProps={{ max: maxDate }}
        onChange={(event) => onDateChange(event.target.value)}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ width: { xs: "100%", sm: 220 } }}
      />

      <Button
        variant="outlined"
        endIcon={<ChevronRightIcon />}
        disabled={nextDisabled}
        onClick={onNextDay}
        sx={{ textTransform: "none", alignSelf: { xs: "stretch", sm: "center" } }}
      >
        {nextDayLabel}
      </Button>
    </Stack>
  );
}
