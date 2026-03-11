import {
  Alert,
  Box,
  Button,
  FormControl,
  FormControlLabel,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import { parseApiError } from "@/api/parseApiError";
import { providersApi } from "@/api/providersApi";
import { schedulersApi } from "@/api/schedulersApi";
import { AutomationRuleBuilder } from "@/features/automation/components/AutomationRuleBuilder";
import {
  createAutomationConditionDraft,
  type AutomationRuleComparator,
  type AutomationRuleConditionDraft,
  type AutomationRuleGroupOperator,
  type AutomationRuleSource,
  isBatteryRuleSource,
  isPowerRuleSource,
} from "@/features/automation/types/rules";
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
  conditionsEnabled: boolean;
  ruleOperator: AutomationRuleGroupOperator;
  conditions: AutomationRuleConditionDraft[];
};

type DayValidation = {
  invalid: Set<number>;
  overlap: Set<number>;
};

type SlotConditionValidation = {
  valueValid: boolean;
  unitValid: boolean;
  parsedValue: number | null;
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
const DECIMAL_INPUT_PATTERN = /^[0-9]*([.,][0-9]*)?$/;
const DAY_TO_JS_INDEX: Record<SchedulerDayOfWeek, number> = {
  MONDAY: 1,
  TUESDAY: 2,
  WEDNESDAY: 3,
  THURSDAY: 4,
  FRIDAY: 5,
  SATURDAY: 6,
  SUNDAY: 0,
};

function parseDecimalInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function isValidClockTime(value: string | null | undefined): value is string {
  if (!value) return false;
  const match = /^(\d{2}):(\d{2})$/.exec(value.trim());
  if (!match) return false;
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  return (
    Number.isInteger(hours) &&
    Number.isInteger(minutes) &&
    hours >= 0 &&
    hours <= 23 &&
    minutes >= 0 &&
    minutes <= 59
  );
}

function getReferenceDateForDay(day: SchedulerDayOfWeek): Date {
  const now = new Date();
  const base = new Date(now);
  base.setHours(12, 0, 0, 0);
  const delta = DAY_TO_JS_INDEX[day] - base.getDay();
  base.setDate(base.getDate() + delta);
  return base;
}

function toUtcTimeForDay(day: SchedulerDayOfWeek, localTime: string): string {
  if (!isValidClockTime(localTime)) return localTime;
  const [hours, minutes] = localTime.split(":").map(Number);
  const localDate = getReferenceDateForDay(day);
  localDate.setHours(hours, minutes, 0, 0);
  return localDate.toISOString().slice(11, 16);
}

function toLocalTimeFromUtc(day: SchedulerDayOfWeek, utcTime: string): string {
  if (!isValidClockTime(utcTime)) return utcTime;
  const [hours, minutes] = utcTime.split(":").map(Number);
  const referenceDate = getReferenceDateForDay(day);
  const utcDate = new Date(
    Date.UTC(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate(),
      hours,
      minutes,
      0,
      0,
    ),
  );

  return `${String(utcDate.getHours()).padStart(2, "0")}:${String(
    utcDate.getMinutes(),
  ).padStart(2, "0")}`;
}

function resolveSlotLocalTime(
  slot: Scheduler["slots"][number],
  day: SchedulerDayOfWeek,
  type: "start" | "end",
): string {
  const localValue =
    type === "start" ? slot.start_local_time : slot.end_local_time;
  if (isValidClockTime(localValue)) return localValue;

  const legacyValue = type === "start" ? slot.start_time : slot.end_time;
  if (isValidClockTime(legacyValue)) return legacyValue;

  const utcValue = type === "start" ? slot.start_utc_time : slot.end_utc_time;
  if (isValidClockTime(utcValue)) return toLocalTimeFromUtc(day, utcValue);

  return type === "start" ? DEFAULT_START_TIME : DEFAULT_END_TIME;
}

function toUniqueUnits(units: Array<string | null | undefined>): string[] {
  return Array.from(
    new Set(
      units
        .map((unit) => unit?.trim())
        .filter((unit): unit is string => Boolean(unit)),
    ),
  ).sort((left, right) => left.localeCompare(right));
}

function createDefaultSlot(defaultUnit = ""): DaySlotState {
  return {
    start: DEFAULT_START_TIME,
    end: DEFAULT_END_TIME,
    conditionsEnabled: false,
    ruleOperator: "ANY",
    conditions: [
      createAutomationConditionDraft("provider_primary_power", defaultUnit),
    ],
  };
}

function withDefaultUnitForThresholdSlots(
  rows: Record<SchedulerDayOfWeek, DayRowState>,
  defaultUnit: string,
): Record<SchedulerDayOfWeek, DayRowState> {
  let changed = false;

  const next = SCHEDULER_DAY_ORDER.reduce(
    (acc, day) => {
      const row = rows[day];
      const nextSlots = row.slots.map((slot) => {
        let slotChanged = false;
        const nextConditions = slot.conditions.map((condition) => {
          if (!isPowerRuleSource(condition.source) || condition.unit) {
            return condition;
          }
          changed = true;
          slotChanged = true;
          return {
            ...condition,
            unit: defaultUnit,
          };
        });
        if (!slotChanged) {
          return slot;
        }
        return {
          ...slot,
          conditions: nextConditions,
        };
      });

      acc[day] = {
        ...row,
        slots: nextSlots,
      };
      return acc;
    },
    {} as Record<SchedulerDayOfWeek, DayRowState>,
  );

  return changed ? next : rows;
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
      start: resolveSlotLocalTime(slot, slot.day_of_week, "start"),
      end: resolveSlotLocalTime(slot, slot.day_of_week, "end"),
      conditionsEnabled: Boolean(slot.use_power_threshold),
      ruleOperator: "ANY",
      conditions: slot.use_power_threshold
        ? [
            {
              id: `${slot.day_of_week}-${slot.start_time ?? slot.start_utc_time ?? "slot"}-power`,
              source: "provider_primary_power",
              comparator: "gte",
              value:
                slot.power_threshold_value != null
                  ? String(slot.power_threshold_value)
                  : "",
              unit: slot.power_threshold_unit ?? "",
            },
          ]
        : [createAutomationConditionDraft("provider_primary_power", "")],
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

function validateSlotCondition(
  condition: AutomationRuleConditionDraft,
  availableUnits: string[],
): SlotConditionValidation {
  if (isBatteryRuleSource(condition.source)) {
    const parsedValue = parseDecimalInput(condition.value);
    return {
      valueValid:
        parsedValue != null && parsedValue >= 0 && parsedValue <= 100,
      unitValid: condition.unit === "%",
      parsedValue,
    };
  }

  const parsedValue = parseDecimalInput(condition.value);
  return {
    valueValid: parsedValue != null && parsedValue >= 0,
    unitValid: condition.unit !== "" && availableUnits.includes(condition.unit),
    parsedValue,
  };
}

function getPersistedPowerCondition(
  slot: DaySlotState,
  availableUnits: string[],
) {
  if (!slot.conditionsEnabled) {
    return null;
  }

  const persistedCondition = slot.conditions.find((condition) =>
    isPowerRuleSource(condition.source),
  );
  if (!persistedCondition) {
    return null;
  }

  const validation = validateSlotCondition(persistedCondition, availableUnits);
  if (!validation.valueValid || !validation.unitValid) {
    return null;
  }

  return {
    condition: persistedCondition,
    parsedValue: validation.parsedValue,
  };
}

function hasAdvancedPreviewConditions(slot: DaySlotState) {
  if (!slot.conditionsEnabled) {
    return false;
  }

  return (
    slot.ruleOperator !== "ANY" ||
    slot.conditions.length !== 1 ||
    slot.conditions.some((condition) => !isPowerRuleSource(condition.source))
  );
}

function validateSlotConditions(
  slot: DaySlotState,
  availableUnits: string[],
) {
  if (!slot.conditionsEnabled) {
    return {
      hasInvalidCondition: false,
      hasPersistablePowerCondition: true,
    };
  }

  return {
    hasInvalidCondition: slot.conditions.some((condition) => {
      const validation = validateSlotCondition(condition, availableUnits);
      return !validation.valueValid || !validation.unitValid;
    }),
    hasPersistablePowerCondition:
      getPersistedPowerCondition(slot, availableUnits) != null,
  };
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
  const [availableUnits, setAvailableUnits] = useState<string[]>([]);
  const [hasBatteryTelemetry, setHasBatteryTelemetry] = useState(false);
  const [unitsLoading, setUnitsLoading] = useState(true);
  const [unitsLoadError, setUnitsLoadError] = useState<string | null>(null);
  const browserTimezone =
    (typeof Intl !== "undefined" &&
      Intl.DateTimeFormat().resolvedOptions().timeZone) ||
    "UTC";
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

  useEffect(() => {
    let cancelled = false;

    const applyUnits = (units: string[], hasBatterySoc: boolean) => {
      if (cancelled) return;
      setAvailableUnits(units);
      setHasBatteryTelemetry(hasBatterySoc);
      if (units.length > 0) {
        setRows((prev) => withDefaultUnitForThresholdSlots(prev, units[0]));
      }
    };

    const loadUnits = async () => {
      setUnitsLoading(true);
      setUnitsLoadError(null);

      let providerUnits: string[] = [];
      let accountHasBatteryTelemetry = false;

      try {
        const [unitResponse, providersResponse] = await Promise.all([
          schedulersApi.getPowerThresholdUnits(),
          providersApi.getProviders(),
        ]);
        if (cancelled) return;

        const unitsFromEndpoint = toUniqueUnits(unitResponse.data.units ?? []);
        providerUnits = toUniqueUnits(
          providersResponse.data.map((provider) => provider.unit),
        );
        accountHasBatteryTelemetry = providersResponse.data.some(
          (provider) => provider.has_energy_storage,
        );
        const resolvedUnits =
          providerUnits.length > 0 ? providerUnits : unitsFromEndpoint;
        if (resolvedUnits.length > 0) {
          applyUnits(resolvedUnits, accountHasBatteryTelemetry);
          setUnitsLoading(false);
          return;
        }
      } catch {
        // Fallback for older backend versions without scheduler unit endpoint.
      }

      try {
        const fallbackResponse = await providersApi.getProviders();
        if (cancelled) return;
        const unitsFromProviders = toUniqueUnits(
          fallbackResponse.data.map((provider) => provider.unit),
        );
        applyUnits(
          unitsFromProviders,
          fallbackResponse.data.some((provider) => provider.has_energy_storage),
        );
      } catch (error) {
        if (cancelled) return;
        setUnitsLoadError(
          parseApiError(error).message || t("errors.api.generic"),
        );
      } finally {
        if (!cancelled) {
          setUnitsLoading(false);
        }
      }
    };

    void loadUnits();

    return () => {
      cancelled = true;
    };
  }, [t]);

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

  const hasInvalidPowerThreshold = useMemo(
    () =>
      SCHEDULER_DAY_ORDER.some((day) =>
        rows[day].enabled
          ? rows[day].slots.some((slot) => {
              const validation = validateSlotConditions(slot, availableUnits);
              return (
                validation.hasInvalidCondition ||
                (slot.conditionsEnabled && !validation.hasPersistablePowerCondition)
              );
            })
          : false,
      ),
    [availableUnits, rows],
  );

  const hasAdvancedPreviewWarning = useMemo(
    () =>
      SCHEDULER_DAY_ORDER.some((day) =>
        rows[day].enabled
          ? rows[day].slots.some((slot) => hasAdvancedPreviewConditions(slot))
          : false,
      ),
    [rows],
  );

  const handleRowToggle = (day: SchedulerDayOfWeek, enabled: boolean) => {
    setRows((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled,
        slots: prev[day].slots.length
          ? prev[day].slots
          : [createDefaultSlot(availableUnits[0] ?? "")],
      },
    }));
  };

  const handleAddSlot = (day: SchedulerDayOfWeek) => {
    setRows((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        enabled: true,
        slots: [...prev[day].slots, createDefaultSlot(availableUnits[0] ?? "")],
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

  const handleSlotConditionsToggle = (
    day: SchedulerDayOfWeek,
    slotIndex: number,
    enabled: boolean,
  ) => {
    setRows((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((slot, index) => {
          if (index !== slotIndex) return slot;
          return {
            ...slot,
            conditionsEnabled: enabled,
            conditions:
              enabled && slot.conditions.length === 0
                ? [
                    createAutomationConditionDraft(
                      "provider_primary_power",
                      availableUnits[0] ?? "",
                    ),
                  ]
                : slot.conditions,
          };
        }),
      },
    }));
  };

  const handleAddCondition = (day: SchedulerDayOfWeek, slotIndex: number) => {
    setRows((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((slot, index) =>
          index === slotIndex
            ? {
                ...slot,
                conditions: [
                  ...slot.conditions,
                  createAutomationConditionDraft(
                    "provider_primary_power",
                    availableUnits[0] ?? "",
                  ),
                ],
              }
            : slot,
        ),
      },
    }));
  };

  const handleRemoveCondition = (
    day: SchedulerDayOfWeek,
    slotIndex: number,
    conditionId: string,
  ) => {
    setRows((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((slot, index) =>
          index === slotIndex
            ? {
                ...slot,
                conditions: slot.conditions.filter(
                  (condition) => condition.id !== conditionId,
                ),
              }
            : slot,
        ),
      },
    }));
  };

  const handleSlotOperatorChange = (
    day: SchedulerDayOfWeek,
    slotIndex: number,
    operator: AutomationRuleGroupOperator,
  ) => {
    setRows((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((slot, index) =>
          index === slotIndex ? { ...slot, ruleOperator: operator } : slot,
        ),
      },
    }));
  };

  const handleConditionSourceChange = (
    day: SchedulerDayOfWeek,
    slotIndex: number,
    conditionId: string,
    source: AutomationRuleSource,
  ) => {
    setRows((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((slot, index) =>
          index === slotIndex
            ? {
                ...slot,
                conditions: slot.conditions.map((condition) =>
                  condition.id === conditionId
                    ? {
                        ...condition,
                        source,
                        comparator: "gte",
                        value:
                          source === "provider_battery_soc"
                            ? "30"
                            : condition.value,
                        unit:
                          source === "provider_battery_soc"
                            ? "%"
                            : availableUnits[0] ?? condition.unit,
                      }
                    : condition,
                ),
              }
            : slot,
        ),
      },
    }));
  };

  const handleConditionComparatorChange = (
    day: SchedulerDayOfWeek,
    slotIndex: number,
    conditionId: string,
    comparator: AutomationRuleComparator,
  ) => {
    setRows((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((slot, index) =>
          index === slotIndex
            ? {
                ...slot,
                conditions: slot.conditions.map((condition) =>
                  condition.id === conditionId
                    ? { ...condition, comparator }
                    : condition,
                ),
              }
            : slot,
        ),
      },
    }));
  };

  const handleConditionValueChange = (
    day: SchedulerDayOfWeek,
    slotIndex: number,
    conditionId: string,
    value: string,
  ) => {
    const nextValue = value.replace(/\s+/g, "");
    if (nextValue !== "" && !DECIMAL_INPUT_PATTERN.test(nextValue)) return;

    setRows((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((slot, index) =>
          index === slotIndex
            ? {
                ...slot,
                conditions: slot.conditions.map((condition) =>
                  condition.id === conditionId
                    ? { ...condition, value: nextValue }
                    : condition,
                ),
              }
            : slot,
        ),
      },
    }));
  };

  const handleConditionUnitChange = (
    day: SchedulerDayOfWeek,
    slotIndex: number,
    conditionId: string,
    value: string,
  ) => {
    setRows((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((slot, index) =>
          index === slotIndex
            ? {
                ...slot,
                conditions: slot.conditions.map((condition) =>
                  condition.id === conditionId
                    ? { ...condition, unit: value }
                    : condition,
                ),
              }
            : slot,
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
    if (hasInvalidPowerThreshold) return;

    const slots = SCHEDULER_DAY_ORDER.flatMap((day) =>
      rows[day].enabled
        ? [...rows[day].slots]
            .sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
            .map((slot) => {
              const persistedPowerCondition = getPersistedPowerCondition(
                slot,
                availableUnits,
              );
              const startUtc = toUtcTimeForDay(day, slot.start);
              const endUtc = toUtcTimeForDay(day, slot.end);
              return {
                day_of_week: day,
                // Keep local + UTC representation so backend agents can execute correctly across time zones.
                start_local_time: slot.start,
                end_local_time: slot.end,
                start_utc_time: startUtc,
                end_utc_time: endUtc,
                start_time: startUtc,
                end_time: endUtc,
                use_power_threshold: persistedPowerCondition != null,
                power_threshold_value: persistedPowerCondition?.parsedValue ?? null,
                power_threshold_unit: persistedPowerCondition?.condition.unit ?? null,
              };
            })
        : [],
    );

    await onSubmit({
      name: name.trim(),
      timezone: browserTimezone,
      utc_offset_minutes: -new Date().getTimezoneOffset(),
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
          helperText={
            submitted && !name.trim()
              ? t("errors.validation.required")
              : BLANK_HELPER
          }
        />

        {unitsLoadError && <Alert severity="warning">{unitsLoadError}</Alert>}

        {hasAdvancedPreviewWarning && (
          <Alert severity="info">
            {t("schedulers.form.previewWarning")}
          </Alert>
        )}

        {!unitsLoading && availableUnits.length === 0 && (
          <Typography variant="caption" color="text.secondary">
            {t("schedulers.form.noUnitsAvailable")}
          </Typography>
        )}

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
                  direction={{ xs: "column", sm: "row" }}
                  alignItems={{ xs: "stretch", sm: "center" }}
                  justifyContent="space-between"
                  spacing={1}
                >
                  <Typography variant="body2" fontWeight={600}>
                    {t(`schedulers.days.${day}`)}
                  </Typography>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={0.75}
                    alignItems={{ xs: "stretch", sm: "center" }}
                    width={{ xs: "100%", sm: "auto" }}
                  >
                    <Button
                      size="small"
                      startIcon={<AddIcon fontSize="small" />}
                      disabled={!row.enabled || loading}
                      onClick={() => handleAddSlot(day)}
                      fullWidth
                    >
                      {t("schedulers.form.addRange")}
                    </Button>
                    <FormControlLabel
                      sx={{ m: 0, justifyContent: "space-between" }}
                      control={
                        <Switch
                          checked={row.enabled}
                          disabled={loading}
                          onChange={(_, checked) => handleRowToggle(day, checked)}
                        />
                      }
                      label={t("common.enabled")}
                      labelPlacement="start"
                    />
                  </Stack>
                </Stack>

                {row.enabled && (
                  <Stack spacing={1.25} mt={1}>
                    {row.slots.map((slot, slotIndex) => {
                      const hasSlotInvalidRange = validation.invalid.has(slotIndex);
                      const hasSlotOverlap = validation.overlap.has(slotIndex);
                      const rangeError = hasSlotInvalidRange || hasSlotOverlap;
                      const rangeHelperText =
                        submitted && rangeError
                          ? hasSlotInvalidRange
                            ? t("schedulers.form.invalidRange")
                            : t("schedulers.form.overlapRange")
                          : BLANK_HELPER;

                      const slotConditionsValidation = validateSlotConditions(
                        slot,
                        availableUnits,
                      );
                      const powerError =
                        slot.conditionsEnabled &&
                        (!slotConditionsValidation.hasPersistablePowerCondition ||
                          slotConditionsValidation.hasInvalidCondition);

                      const slotError = submitted && (rangeError || powerError);

                      return (
                        <Box
                          key={`${day}-${slotIndex}`}
                          sx={{
                            p: 1,
                            borderRadius: 1.5,
                            border: "1px dashed",
                            borderColor: slotError ? "error.main" : "divider",
                          }}
                        >
                          <Stack spacing={1}>
                            <Box
                              sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                  xs: "1fr",
                                  sm: "1fr 1fr auto",
                                },
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
                                  handleRowTime(
                                    day,
                                    slotIndex,
                                    "start",
                                    event.target.value,
                                  )
                                }
                                disabled={loading}
                                inputProps={{ step: 300 }}
                                sx={textFieldSx}
                                error={submitted && rangeError}
                                helperText={BLANK_HELPER}
                              />

                              <TextField
                                label={t("schedulers.form.end")}
                                size="small"
                                type="time"
                                value={slot.end}
                                onChange={(event) =>
                                  handleRowTime(
                                    day,
                                    slotIndex,
                                    "end",
                                    event.target.value,
                                  )
                                }
                                disabled={loading}
                                inputProps={{ step: 300 }}
                                sx={textFieldSx}
                                error={submitted && rangeError}
                                helperText={rangeHelperText}
                              />

                              <Box
                                display="flex"
                                justifyContent="flex-end"
                                alignItems="center"
                              >
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

                            <AutomationRuleBuilder
                              title={t("schedulers.form.slotRuleTitle")}
                              description={t("schedulers.form.slotRuleDescription")}
                              enabled={slot.conditionsEnabled}
                              onEnabledChange={(checked) =>
                                handleSlotConditionsToggle(day, slotIndex, checked)
                              }
                              operator={slot.ruleOperator}
                              onOperatorChange={(nextOperator) =>
                                handleSlotOperatorChange(day, slotIndex, nextOperator)
                              }
                              conditions={slot.conditions}
                              onAddCondition={() =>
                                handleAddCondition(day, slotIndex)
                              }
                              onRemoveCondition={(conditionId) =>
                                handleRemoveCondition(day, slotIndex, conditionId)
                              }
                              onSourceChange={(conditionId, source) =>
                                handleConditionSourceChange(
                                  day,
                                  slotIndex,
                                  conditionId,
                                  source,
                                )
                              }
                              onComparatorChange={(conditionId, comparator) =>
                                handleConditionComparatorChange(
                                  day,
                                  slotIndex,
                                  conditionId,
                                  comparator,
                                )
                              }
                              onValueChange={(conditionId, value) =>
                                handleConditionValueChange(
                                  day,
                                  slotIndex,
                                  conditionId,
                                  value,
                                )
                              }
                              onUnitChange={(conditionId, unit) =>
                                handleConditionUnitChange(
                                  day,
                                  slotIndex,
                                  conditionId,
                                  unit,
                                )
                              }
                              powerUnits={availableUnits}
                              canUseBatterySoc={hasBatteryTelemetry}
                              disabled={loading || unitsLoading}
                              toggleLabel={t(
                                "schedulers.form.enableSlotConditions",
                              )}
                            />

                            <Box sx={{ minHeight: 20 }}>
                              <Typography
                                variant="caption"
                                color="error"
                                sx={{
                                  visibility:
                                    submitted && powerError ? "visible" : "hidden",
                                }}
                              >
                                {t("schedulers.form.persistablePowerRequired")}
                              </Typography>
                            </Box>
                          </Stack>
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
