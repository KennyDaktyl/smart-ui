import {
  Box,
  Button,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import { SCHEDULER_DAY_ORDER } from "@/features/schedulers/constants";
import type {
  Scheduler,
  SchedulerDayOfWeek,
  SchedulerPayload,
} from "@/features/schedulers/types/scheduler";

type DayRowState = {
  enabled: boolean;
  start: string;
  end: string;
};

type Props = {
  scheduler?: Scheduler | null;
  loading?: boolean;
  submitError?: string | null;
  formId?: string;
  hideActions?: boolean;
  onSubmit: (payload: SchedulerPayload) => Promise<void> | void;
  onCancel: () => void;
};

const DEFAULT_START_TIME = "09:00";
const DEFAULT_END_TIME = "17:00";
const BLANK_HELPER = " ";

function toInitialDayState(
  scheduler?: Scheduler | null,
): Record<SchedulerDayOfWeek, DayRowState> {
  const base = SCHEDULER_DAY_ORDER.reduce(
    (acc, day) => {
      acc[day] = {
        enabled: false,
        start: DEFAULT_START_TIME,
        end: DEFAULT_END_TIME,
      };
      return acc;
    },
    {} as Record<SchedulerDayOfWeek, DayRowState>,
  );

  if (!scheduler?.slots?.length) {
    return base;
  }

  scheduler.slots.forEach((slot) => {
    base[slot.day_of_week] = {
      enabled: true,
      start: slot.start_time,
      end: slot.end_time,
    };
  });

  return base;
}

function toMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  return hours * 60 + minutes;
}

export function SchedulerForm({
  scheduler,
  loading = false,
  submitError = null,
  formId,
  hideActions = false,
  onSubmit,
  onCancel,
}: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState(scheduler?.name ?? "");
  const [rows, setRows] = useState<Record<SchedulerDayOfWeek, DayRowState>>(
    toInitialDayState(scheduler),
  );
  const [submitted, setSubmitted] = useState(false);
  const textFieldSx = {
    backgroundColor: "transparent",
    "& .MuiOutlinedInput-root": {
      backgroundColor: "#ffffff",
    },
    "& .MuiFormHelperText-root": {
      minHeight: 18,
      lineHeight: 1.2,
      mt: 0.5,
    },
  } as const;

  const hasAtLeastOneDay = useMemo(
    () => SCHEDULER_DAY_ORDER.some((day) => rows[day].enabled),
    [rows],
  );

  const hasInvalidRange = useMemo(
    () =>
      SCHEDULER_DAY_ORDER.some((day) => {
        const row = rows[day];
        if (!row.enabled) return false;
        if (!row.start || !row.end) return true;
        return toMinutes(row.start) >= toMinutes(row.end);
      }),
    [rows],
  );

  const handleRowToggle = (day: SchedulerDayOfWeek, enabled: boolean) => {
    setRows((prev) => ({
      ...prev,
      [day]: { ...prev[day], enabled },
    }));
  };

  const handleRowTime = (
    day: SchedulerDayOfWeek,
    key: "start" | "end",
    value: string,
  ) => {
    setRows((prev) => ({
      ...prev,
      [day]: { ...prev[day], [key]: value },
    }));
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    if (!name.trim()) return;
    if (!hasAtLeastOneDay) return;
    if (hasInvalidRange) return;

    const slots = SCHEDULER_DAY_ORDER.filter((day) => rows[day].enabled).map(
      (day) => ({
        day_of_week: day,
        start_time: rows[day].start,
        end_time: rows[day].end,
      }),
    );

    await onSubmit({
      name: name.trim(),
      slots,
    });
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSubmit();
  };

  return (
    <Box component="form" id={formId} onSubmit={handleFormSubmit}>
      <Stack spacing={2.5}>
        <Typography variant="subtitle1" fontWeight={700}>
          {scheduler
            ? t("schedulers.form.editTitle")
            : t("schedulers.form.createTitle")}
        </Typography>

        <TextField
          label={t("schedulers.form.name")}
          size="small"
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          fullWidth
          sx={textFieldSx}
          error={submitted && !name.trim()}
          helperText={submitted && !name.trim() ? t("errors.validation.required") : BLANK_HELPER}
        />

        <Stack spacing={1.25}>
          <Typography variant="subtitle2" fontWeight={600}>
            {t("schedulers.form.timeBlocks")}
          </Typography>

          {SCHEDULER_DAY_ORDER.map((day) => {
            const row = rows[day];
            const invalid =
              row.enabled &&
              (!row.start || !row.end || toMinutes(row.start) >= toMinutes(row.end));

            return (
              <Box
                key={day}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 120px 120px" },
                  gap: 1.25,
                  alignItems: "center",
                  p: 1.25,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: invalid && submitted ? "error.main" : "divider",
                }}
              >
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Typography variant="body2" fontWeight={600}>
                    {t(`schedulers.days.${day}`)}
                  </Typography>
                  <Switch
                    checked={row.enabled}
                    onChange={(_, checked) => handleRowToggle(day, checked)}
                  />
                </Stack>

                <TextField
                  label={t("schedulers.form.start")}
                  size="small"
                  type="time"
                  value={row.start}
                  onChange={(event) => handleRowTime(day, "start", event.target.value)}
                  disabled={!row.enabled}
                  inputProps={{ step: 300 }}
                  sx={textFieldSx}
                  helperText={BLANK_HELPER}
                />

                <TextField
                  label={t("schedulers.form.end")}
                  size="small"
                  type="time"
                  value={row.end}
                  onChange={(event) => handleRowTime(day, "end", event.target.value)}
                  disabled={!row.enabled}
                  inputProps={{ step: 300 }}
                  sx={textFieldSx}
                  error={submitted && invalid}
                  helperText={submitted && invalid ? t("schedulers.form.invalidRange") : BLANK_HELPER}
                />
              </Box>
            );
          })}

          <Box sx={{ minHeight: 20 }}>
            <Typography
              variant="caption"
              color="error"
              sx={{ visibility: submitted && !hasAtLeastOneDay ? "visible" : "hidden" }}
            >
              {t("schedulers.form.noDaySelected")}
            </Typography>
          </Box>
        </Stack>

        <Box sx={{ minHeight: 20 }}>
          <Typography
            variant="caption"
            color="error"
            sx={{ visibility: submitError ? "visible" : "hidden" }}
          >
            {submitError || BLANK_HELPER}
          </Typography>
        </Box>

        {!hideActions && (
          <Box display="flex" justifyContent="flex-end" gap={1}>
            <Button variant="outlined" onClick={onCancel} disabled={loading}>
              {t("common.cancel")}
            </Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {t("common.save")}
            </Button>
          </Box>
        )}
      </Stack>
    </Box>
  );
}
