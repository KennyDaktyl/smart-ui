import {
  Box,
  Button,
  IconButton,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
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
  slots: DaySlotState[];
};

type DaySlotState = {
  start: string;
  end: string;
};

type DayValidation = {
  invalid: Set<number>;
  overlap: Set<number>;
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

function createDefaultSlot(): DaySlotState {
  return {
    start: DEFAULT_START_TIME,
    end: DEFAULT_END_TIME,
  };
}

function toInitialDayState(
  scheduler?: Scheduler | null,
): Record<SchedulerDayOfWeek, DayRowState> {
  const base = SCHEDULER_DAY_ORDER.reduce(
    (acc, day) => {
      acc[day] = {
        enabled: false,
        slots: [createDefaultSlot()],
      };
      return acc;
    },
    {} as Record<SchedulerDayOfWeek, DayRowState>,
  );

  if (!scheduler?.slots?.length) {
    return base;
  }

  scheduler.slots.forEach((slot) => {
    const row = base[slot.day_of_week];
    if (!row.enabled) {
      row.enabled = true;
      row.slots = [];
    }

    row.slots.push({
      start: slot.start_time,
      end: slot.end_time,
    });
  });

  SCHEDULER_DAY_ORDER.forEach((day) => {
    if (!base[day].enabled) return;
    base[day].slots.sort((a, b) => toMinutes(a.start) - toMinutes(b.start));
  });

  return base;
}

function toMinutes(value: string): number {
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return Number.NaN;
  }
  return hours * 60 + minutes;
}

function buildDayValidation(row: DayRowState): DayValidation {
  const invalid = new Set<number>();
  const overlap = new Set<number>();

  if (!row.enabled) {
    return { invalid, overlap };
  }

  const normalized: Array<{ index: number; start: number; end: number }> = [];

  row.slots.forEach((slot, index) => {
    if (!slot.start || !slot.end) {
      invalid.add(index);
      return;
    }

    const start = toMinutes(slot.start);
    const end = toMinutes(slot.end);
    if (!Number.isFinite(start) || !Number.isFinite(end) || start >= end) {
      invalid.add(index);
      return;
    }

    normalized.push({ index, start, end });
  });

  normalized.sort((a, b) => a.start - b.start);

  for (let index = 1; index < normalized.length; index += 1) {
    const previous = normalized[index - 1];
    const current = normalized[index];
    if (current.start < previous.end) {
      overlap.add(previous.index);
      overlap.add(current.index);
    }
  }

  return { invalid, overlap };
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

  const dayValidations = useMemo(
    () =>
      SCHEDULER_DAY_ORDER.reduce(
        (acc, day) => {
          acc[day] = buildDayValidation(rows[day]);
          return acc;
        },
        {} as Record<SchedulerDayOfWeek, DayValidation>,
      ),
    [rows],
  );

  const hasInvalidRange = useMemo(
    () =>
      SCHEDULER_DAY_ORDER.some((day) => dayValidations[day].invalid.size > 0),
    [dayValidations],
  );

  const hasOverlapRange = useMemo(
    () =>
      SCHEDULER_DAY_ORDER.some((day) => dayValidations[day].overlap.size > 0),
    [dayValidations],
  );

  const handleRowToggle = (day: SchedulerDayOfWeek, enabled: boolean) => {
    setRows((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled,
        slots: prev[day].slots.length ? prev[day].slots : [createDefaultSlot()],
      },
    }));
  };

  const handleAddSlot = (day: SchedulerDayOfWeek) => {
    setRows((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: true,
        slots: [...prev[day].slots, createDefaultSlot()],
      },
    }));
  };

  const handleRemoveSlot = (day: SchedulerDayOfWeek, slotIndex: number) => {
    setRows((prev) => {
      const row = prev[day];
      if (row.slots.length <= 1) return prev;

      return {
        ...prev,
        [day]: {
          ...row,
          slots: row.slots.filter((_, index) => index !== slotIndex),
        },
      };
    });
  };

  const handleRowTime = (
    day: SchedulerDayOfWeek,
    slotIndex: number,
    key: "start" | "end",
    value: string,
  ) => {
    setRows((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((slot, index) =>
          index === slotIndex ? { ...slot, [key]: value } : slot,
        ),
      },
    }));
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    if (!name.trim()) return;
    if (!hasAtLeastOneDay) return;
    if (hasInvalidRange) return;
    if (hasOverlapRange) return;

    const slots = SCHEDULER_DAY_ORDER.flatMap((day) =>
      rows[day].enabled
        ? [...rows[day].slots]
            .sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
            .map((slot) => ({
              day_of_week: day,
              start_time: slot.start,
              end_time: slot.end,
            }))
        : [],
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
            const validation = dayValidations[day];
            const dayInvalid =
              row.enabled &&
              submitted &&
              (validation.invalid.size > 0 || validation.overlap.size > 0);

            return (
              <Box
                key={day}
                sx={{
                  p: 1.25,
                  borderRadius: 2,
                  border: "1px solid",
                  borderColor: dayInvalid ? "error.main" : "divider",
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
                  <Stack direction="row" spacing={0.5} alignItems="center">
                    <Button
                      size="small"
                      startIcon={<AddIcon fontSize="small" />}
                      disabled={!row.enabled || loading}
                      onClick={() => handleAddSlot(day)}
                    >
                      {t("schedulers.form.addRange")}
                    </Button>
                    <Switch
                      checked={row.enabled}
                      disabled={loading}
                      onChange={(_, checked) => handleRowToggle(day, checked)}
                    />
                  </Stack>
                </Stack>

                {row.enabled && (
                  <Stack spacing={1.25} mt={1}>
                    {row.slots.map((slot, slotIndex) => {
                      const hasSlotInvalidRange = validation.invalid.has(slotIndex);
                      const hasSlotOverlap = validation.overlap.has(slotIndex);
                      const slotError =
                        submitted && (hasSlotInvalidRange || hasSlotOverlap);
                      const slotHelperText = slotError
                        ? hasSlotInvalidRange
                          ? t("schedulers.form.invalidRange")
                          : t("schedulers.form.overlapRange")
                        : BLANK_HELPER;

                      return (
                        <Box
                          key={`${day}-${slotIndex}`}
                          sx={{
                            display: "grid",
                            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr auto" },
                            gap: 1,
                            alignItems: "center",
                          }}
                        >
                          <TextField
                            label={t("schedulers.form.start")}
                            size="small"
                            type="time"
                            value={slot.start}
                            onChange={(event) =>
                              handleRowTime(day, slotIndex, "start", event.target.value)
                            }
                            disabled={loading}
                            inputProps={{ step: 300 }}
                            sx={textFieldSx}
                            error={slotError}
                            helperText={BLANK_HELPER}
                          />

                          <TextField
                            label={t("schedulers.form.end")}
                            size="small"
                            type="time"
                            value={slot.end}
                            onChange={(event) =>
                              handleRowTime(day, slotIndex, "end", event.target.value)
                            }
                            disabled={loading}
                            inputProps={{ step: 300 }}
                            sx={textFieldSx}
                            error={slotError}
                            helperText={slotHelperText}
                          />

                          <Box display="flex" justifyContent="flex-end" alignItems="center">
                            <IconButton
                              color="error"
                              aria-label={t("schedulers.form.removeRange")}
                              onClick={() => handleRemoveSlot(day, slotIndex)}
                              disabled={loading || row.slots.length === 1}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </Box>
                        </Box>
                      );
                    })}
                  </Stack>
                )}
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
