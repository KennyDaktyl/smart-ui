import {
  Alert,
  Box,
  Button,
  CircularProgress,
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

import { devicesApi } from "@/api/devicesApi";
import { parseApiError } from "@/api/parseApiError";
import { providersApi } from "@/api/providersApi";
import { schedulersApi } from "@/api/schedulersApi";
import type { Device } from "@/features/devices/types/devicesType";
import type { DeviceDependencyAction } from "@/features/devices/types/dependency";
import {
  createAutomationConditionDraft,
  createAutomationGroupDraft,
  type AutomationRuleComparator,
  type AutomationRuleConditionDraft,
  type AutomationRuleGroupDraft,
  type AutomationRuleGroupOperator,
  type AutomationRuleGroupPayload,
  type AutomationRuleNodeDraft,
  type AutomationRuleNodePayload,
  type AutomationRuleSource,
  isAutomationRuleGroupDraft,
  isAutomationRuleGroupPayload,
  isBatteryRuleSource,
  isPowerRuleSource,
} from "@/features/automation/types/rules";
import { SCHEDULER_DAY_ORDER } from "@/features/schedulers/constants";
import { SchedulerRuleTreeBuilder } from "@/features/schedulers/components/SchedulerRuleTreeBuilder";
import type {
  Scheduler,
  SchedulerActivationRule,
  SchedulerControlMode,
  SchedulerControlPolicy,
  SchedulerDayOfWeek,
  SchedulerPayload,
} from "@/features/schedulers/types/scheduler";
import {
  DEFAULT_TEMPERATURE_POLICY_SENSOR_ID,
  getSlotDependencyRule,
} from "@/features/schedulers/utils/policy";

type DayRowState = {
  enabled: boolean;
  slots: DaySlotState[];
};

type DaySlotState = {
  start: string;
  end: string;
  conditionsEnabled: boolean;
  rule: AutomationRuleGroupDraft;
  controlMode: SchedulerControlMode;
  controlPolicy: {
    sensorId: string;
    targetTemperatureC: string;
    stopAboveTargetDeltaC: string;
    startBelowTargetDeltaC: string;
    heatUpOnActivate: boolean;
    endBehavior: "KEEP_CURRENT_STATE" | "FORCE_OFF";
  };
  deviceDependencyRule: {
    targetDeviceId: number | "";
    whenSourceOn: DeviceDependencyAction;
    whenSourceOff: DeviceDependencyAction;
  };
};

type DayValidation = {
  invalid: Set<number>;
  overlap: Set<number>;
};

type SlotConditionValidation = {
  parsedValue: number | null;
  errors: {
    value?: "required" | "invalid" | "batteryRange";
    unit?: "required" | "invalid";
  };
};

type SlotRuleValidation = {
  hasInvalidCondition: boolean;
  hasEmptyGroup: boolean;
  groupErrors: Record<string, "empty">;
  conditionErrors: Record<
    string,
    {
      value?: "required" | "invalid" | "batteryRange";
      unit?: "required" | "invalid";
    }
  >;
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
const DEPENDENCY_ACTION_OPTIONS: DeviceDependencyAction[] = ["NONE", "ON", "OFF"];
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

function createDefaultRule(defaultUnit = ""): AutomationRuleGroupDraft {
  return createAutomationGroupDraft("ANY", [
    createAutomationConditionDraft("provider_primary_power", defaultUnit),
  ]);
}

function createDefaultSlot(defaultUnit = ""): DaySlotState {
  return {
    start: DEFAULT_START_TIME,
    end: DEFAULT_END_TIME,
    conditionsEnabled: false,
    rule: createDefaultRule(defaultUnit),
    controlMode: "DIRECT",
    controlPolicy: {
      sensorId: DEFAULT_TEMPERATURE_POLICY_SENSOR_ID,
      targetTemperatureC: "65",
      stopAboveTargetDeltaC: "0",
      startBelowTargetDeltaC: "10",
      heatUpOnActivate: true,
      endBehavior: "FORCE_OFF",
    },
    deviceDependencyRule: {
      targetDeviceId: "",
      whenSourceOn: "NONE",
      whenSourceOff: "NONE",
    },
  };
}

function toEditableControlPolicy(
  slot: Scheduler["slots"][number],
): SchedulerControlPolicy | null {
  return slot.control_policy ?? slot.control_policy_json ?? null;
}

function updateRuleConditionsWithoutUnit(
  group: AutomationRuleGroupDraft,
  defaultUnit: string,
): AutomationRuleGroupDraft {
  let changed = false;

  const nextItems = group.items.map((item) => {
    if (isAutomationRuleGroupDraft(item)) {
      const nextGroup = updateRuleConditionsWithoutUnit(item, defaultUnit);
      if (nextGroup !== item) {
        changed = true;
      }
      return nextGroup;
    }

    if (!isPowerRuleSource(item.source) || item.unit) {
      return item;
    }

    changed = true;
    return {
      ...item,
      unit: defaultUnit,
    };
  });

  return changed
    ? {
        ...group,
        items: nextItems,
      }
    : group;
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
        const nextRule = updateRuleConditionsWithoutUnit(slot.rule, defaultUnit);
        if (nextRule !== slot.rule) {
          changed = true;
          return {
            ...slot,
            rule: nextRule,
          };
        }
        return slot;
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

function normalizeRulePayload(
  rule: SchedulerActivationRule | null | undefined,
): AutomationRuleGroupPayload | null {
  if (!rule) {
    return null;
  }

  const rawItems = rule.items ?? rule.conditions ?? [];
  if (rawItems.length === 0) {
    return null;
  }

  return {
    operator: rule.operator,
    items: rawItems.flatMap((item) => {
      if (isAutomationRuleGroupPayload(item)) {
        const normalizedGroup = normalizeRulePayload(item);
        return normalizedGroup ? [normalizedGroup] : [];
      }

      return [item];
    }),
  };
}

function createDraftRuleFromPayload(
  rule: AutomationRuleGroupPayload,
): AutomationRuleGroupDraft {
  return createAutomationGroupDraft(
    rule.operator,
    (rule.items ?? []).map((item): AutomationRuleNodeDraft => {
      if (isAutomationRuleGroupPayload(item)) {
        return createDraftRuleFromPayload(item);
      }

      return {
        id: `${item.source}-${Math.random().toString(36).slice(2, 10)}`,
        source: item.source,
        comparator: item.comparator,
        value: String(item.value),
        unit: item.unit,
      };
    }),
  );
}

function toEditableRule(
  slot: Scheduler["slots"][number],
): AutomationRuleGroupPayload | null {
  return normalizeRulePayload(slot.activation_rule ?? slot.activation_rule_json);
}

function toDraftRule(
  slot: Scheduler["slots"][number],
): Pick<DaySlotState, "conditionsEnabled" | "rule"> {
  const activationRule = toEditableRule(slot);
  if (activationRule) {
    return {
      conditionsEnabled: true,
      rule: createDraftRuleFromPayload(activationRule),
    };
  }

  if (slot.use_power_threshold) {
    return {
      conditionsEnabled: true,
      rule: createAutomationGroupDraft("ANY", [
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
      ]),
    };
  }

  return {
    conditionsEnabled: false,
    rule: createDefaultRule(""),
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
      start: resolveSlotLocalTime(slot, slot.day_of_week, "start"),
      end: resolveSlotLocalTime(slot, slot.day_of_week, "end"),
      controlMode: slot.control_mode ?? "DIRECT",
      controlPolicy: {
        sensorId: toEditableControlPolicy(slot)?.sensor_id ?? "",
        targetTemperatureC:
          toEditableControlPolicy(slot)?.target_temperature_c != null
            ? String(toEditableControlPolicy(slot)?.target_temperature_c)
            : "65",
        stopAboveTargetDeltaC:
          toEditableControlPolicy(slot)?.stop_above_target_delta_c != null
            ? String(toEditableControlPolicy(slot)?.stop_above_target_delta_c)
            : "0",
        startBelowTargetDeltaC:
          toEditableControlPolicy(slot)?.start_below_target_delta_c != null
            ? String(toEditableControlPolicy(slot)?.start_below_target_delta_c)
            : "10",
        heatUpOnActivate:
          toEditableControlPolicy(slot)?.heat_up_on_activate ?? true,
        endBehavior:
          toEditableControlPolicy(slot)?.end_behavior ?? "FORCE_OFF",
      },
      deviceDependencyRule: {
        targetDeviceId: getSlotDependencyRule(slot)?.target_device_id ?? "",
        whenSourceOn: getSlotDependencyRule(slot)?.when_source_on ?? "NONE",
        whenSourceOff: getSlotDependencyRule(slot)?.when_source_off ?? "NONE",
      },
      ...toDraftRule(slot),
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
      parsedValue,
      errors: {
        value:
          condition.value.trim() === ""
            ? "required"
            : parsedValue == null
              ? "invalid"
              : parsedValue < 0 || parsedValue > 100
                ? "batteryRange"
                : undefined,
        unit: condition.unit === "%" ? undefined : "invalid",
      },
    };
  }

  const parsedValue = parseDecimalInput(condition.value);
  return {
    parsedValue,
    errors: {
      value:
        condition.value.trim() === ""
          ? "required"
          : parsedValue == null || parsedValue < 0
            ? "invalid"
            : undefined,
      unit:
        condition.unit === ""
          ? "required"
          : availableUnits.includes(condition.unit)
            ? undefined
            : "invalid",
    },
  };
}

function validateRuleDraft(
  group: AutomationRuleGroupDraft,
  availableUnits: string[],
): SlotRuleValidation {
  if (group.items.length === 0) {
    return {
      hasInvalidCondition: false,
      hasEmptyGroup: true,
      groupErrors: {
        [group.id]: "empty",
      },
      conditionErrors: {},
    };
  }

  return group.items.reduce(
    (acc, item) => {
      if (isAutomationRuleGroupDraft(item)) {
        const nested = validateRuleDraft(item, availableUnits);
        return {
          hasInvalidCondition:
            acc.hasInvalidCondition || nested.hasInvalidCondition,
          hasEmptyGroup: acc.hasEmptyGroup || nested.hasEmptyGroup,
          groupErrors: {
            ...acc.groupErrors,
            ...nested.groupErrors,
          },
          conditionErrors: {
            ...acc.conditionErrors,
            ...nested.conditionErrors,
          },
        };
      }

      const validation = validateSlotCondition(item, availableUnits);
      const hasConditionError = Boolean(
        validation.errors.value || validation.errors.unit,
      );
      return {
        hasInvalidCondition: acc.hasInvalidCondition || hasConditionError,
        hasEmptyGroup: acc.hasEmptyGroup,
        groupErrors: acc.groupErrors,
        conditionErrors: hasConditionError
          ? {
              ...acc.conditionErrors,
              [item.id]: validation.errors,
            }
          : acc.conditionErrors,
      };
    },
    {
      hasInvalidCondition: false,
      hasEmptyGroup: false,
      groupErrors: {},
      conditionErrors: {},
    },
  );
}

function buildActivationRule(
  group: AutomationRuleGroupDraft,
  availableUnits: string[],
): AutomationRuleGroupPayload | null {
  const items = group.items.flatMap((item): AutomationRuleNodePayload[] => {
    if (isAutomationRuleGroupDraft(item)) {
      const nested = buildActivationRule(item, availableUnits);
      return nested ? [nested] : [];
    }

    const validation = validateSlotCondition(item, availableUnits);
    if (
      validation.errors.value ||
      validation.errors.unit ||
      validation.parsedValue == null
    ) {
      return [];
    }

    return [
      {
        source: item.source,
        comparator: item.comparator,
        value: validation.parsedValue,
        unit: item.unit,
      },
    ];
  });

  if (items.length === 0) {
    return null;
  }

  return {
    operator: group.operator,
    items,
  };
}

function isConditionPayload(
  item: AutomationRuleNodePayload,
): item is Exclude<AutomationRuleNodePayload, AutomationRuleGroupPayload> {
  return "source" in item;
}

function isLegacyPowerOnlyRule(rule: AutomationRuleGroupPayload | null): boolean {
  if (rule == null || rule.operator !== "ANY") {
    return false;
  }

  const items = rule.items ?? [];
  if (items.length !== 1) {
    return false;
  }

  const [item] = items;
  return (
    isConditionPayload(item) &&
    item.source === "provider_primary_power" &&
    item.comparator === "gte"
  );
}

function getPersistedPowerCondition(
  group: AutomationRuleGroupDraft,
  availableUnits: string[],
) {
  const activationRule = buildActivationRule(group, availableUnits);
  if (!isLegacyPowerOnlyRule(activationRule)) {
    return null;
  }

  const [condition] = activationRule.items ?? [];
  if (!condition || !isConditionPayload(condition)) {
    return null;
  }

  return {
    condition,
    parsedValue: condition.value,
  };
}

function isLegacyPowerOnlyDraft(group: AutomationRuleGroupDraft): boolean {
  if (group.operator !== "ANY" || group.items.length !== 1) {
    return false;
  }

  const [item] = group.items;
  return (
    !isAutomationRuleGroupDraft(item) &&
    item.source === "provider_primary_power" &&
    item.comparator === "gte"
  );
}

function updateGroupById(
  group: AutomationRuleGroupDraft,
  targetGroupId: string,
  updater: (group: AutomationRuleGroupDraft) => AutomationRuleGroupDraft,
): AutomationRuleGroupDraft {
  if (group.id === targetGroupId) {
    return updater(group);
  }

  let changed = false;
  const nextItems = group.items.map((item) => {
    if (!isAutomationRuleGroupDraft(item)) {
      return item;
    }

    const nextGroup = updateGroupById(item, targetGroupId, updater);
    if (nextGroup !== item) {
      changed = true;
    }
    return nextGroup;
  });

  return changed
    ? {
        ...group,
        items: nextItems,
      }
    : group;
}

function updateConditionById(
  group: AutomationRuleGroupDraft,
  targetConditionId: string,
  updater: (
    condition: AutomationRuleConditionDraft,
  ) => AutomationRuleConditionDraft,
): AutomationRuleGroupDraft {
  let changed = false;
  const nextItems = group.items.map((item) => {
    if (isAutomationRuleGroupDraft(item)) {
      const nextGroup = updateConditionById(item, targetConditionId, updater);
      if (nextGroup !== item) {
        changed = true;
      }
      return nextGroup;
    }

    if (item.id !== targetConditionId) {
      return item;
    }

    changed = true;
    return updater(item);
  });

  return changed
    ? {
        ...group,
        items: nextItems,
      }
    : group;
}

function removeNodeById(
  group: AutomationRuleGroupDraft,
  targetNodeId: string,
): AutomationRuleGroupDraft {
  let changed = false;
  const nextItems = group.items.flatMap((item) => {
    if (item.id === targetNodeId) {
      changed = true;
      return [];
    }

    if (!isAutomationRuleGroupDraft(item)) {
      return [item];
    }

    const nextGroup = removeNodeById(item, targetNodeId);
    if (nextGroup !== item) {
      changed = true;
    }
    return [nextGroup];
  });

  return changed
    ? {
        ...group,
        items: nextItems,
      }
    : group;
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
  const [availableDevices, setAvailableDevices] = useState<Device[]>([]);
  const [devicesLoading, setDevicesLoading] = useState(true);
  const [devicesLoadError, setDevicesLoadError] = useState<string | null>(null);
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

  useEffect(() => {
    let cancelled = false;

    const loadDevices = async () => {
      setDevicesLoading(true);
      setDevicesLoadError(null);
      try {
        const response = await devicesApi.list();
        if (cancelled) return;
        setAvailableDevices(response.data);
      } catch (error) {
        if (cancelled) return;
        setDevicesLoadError(parseApiError(error).message || t("errors.api.generic"));
      } finally {
        if (!cancelled) {
          setDevicesLoading(false);
        }
      }
    };

    void loadDevices();
    return () => {
      cancelled = true;
    };
  }, [t]);

  const hasAtLeastOneDay = useMemo(
    () => SCHEDULER_DAY_ORDER.some((day) => rows[day].enabled),
    [rows],
  );

  const slotRuleValidations = useMemo(
    () =>
      SCHEDULER_DAY_ORDER.reduce(
        (acc, day) => {
          acc[day] = rows[day].slots.map((slot) =>
            validateRuleDraft(slot.rule, availableUnits),
          );
          return acc;
        },
        {} as Record<SchedulerDayOfWeek, SlotRuleValidation[]>,
      ),
    [availableUnits, rows],
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

  const hasInvalidConditions = useMemo(
    () =>
      SCHEDULER_DAY_ORDER.some((day) =>
        rows[day].enabled
          ? rows[day].slots.some((slot, slotIndex) => {
              if (!slot.conditionsEnabled) {
                return false;
              }
              const validation = slotRuleValidations[day][slotIndex];
              return validation.hasInvalidCondition || validation.hasEmptyGroup;
            })
          : false,
      ),
    [rows, slotRuleValidations],
  );

  const hasAdvancedPreviewWarning = useMemo(
    () =>
      SCHEDULER_DAY_ORDER.some((day) =>
        rows[day].enabled
          ? rows[day].slots.some(
              (slot) =>
                slot.conditionsEnabled && !isLegacyPowerOnlyDraft(slot.rule),
            )
          : false,
      ),
    [rows],
  );

  const validationMessages = useMemo(() => {
    if (!submitted) {
      return [];
    }

    const messages: string[] = [];
    if (!name.trim()) {
      messages.push(t("schedulers.form.nameRequired"));
    }
    if (!hasAtLeastOneDay) {
      messages.push(t("schedulers.form.noDaySelected"));
    }
    if (hasInvalidRange) {
      messages.push(t("schedulers.form.invalidRange"));
    }
    if (hasOverlapRange) {
      messages.push(t("schedulers.form.overlapRange"));
    }
    if (hasInvalidConditions) {
      messages.push(t("schedulers.form.invalidConditions"));
    }

    return Array.from(new Set(messages));
  }, [
    hasAtLeastOneDay,
    hasInvalidConditions,
    hasInvalidRange,
    hasOverlapRange,
    name,
    submitted,
    t,
  ]);

  const getConditionFieldErrorText = (
    code?: "required" | "invalid" | "batteryRange",
  ) => {
    if (!code) return undefined;
    if (code === "required") {
      return t("errors.validation.required");
    }
    if (code === "batteryRange") {
      return t("automation.validation.batteryRange");
    }
    return t("automation.validation.valueInvalid");
  };

  const getUnitFieldErrorText = (code?: "required" | "invalid") => {
    if (!code) return undefined;
    return code === "required"
      ? t("automation.validation.unitRequired")
      : t("automation.validation.unitInvalid");
  };

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
            rule:
              enabled && slot.rule.items.length === 0
                ? createDefaultRule(availableUnits[0] ?? "")
                : slot.rule,
          };
        }),
      },
    }));
  };

  const handleSlotControlModeChange = (
    day: SchedulerDayOfWeek,
    slotIndex: number,
    controlMode: SchedulerControlMode,
  ) => {
    setRows((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((slot, index) =>
          index === slotIndex ? { ...slot, controlMode } : slot,
        ),
      },
    }));
  };

  const handleSlotControlPolicyChange = (
    day: SchedulerDayOfWeek,
    slotIndex: number,
    key: keyof DaySlotState["controlPolicy"],
    value: string | boolean,
  ) => {
    setRows((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((slot, index) =>
          index === slotIndex
            ? {
                ...slot,
                controlPolicy: {
                  ...slot.controlPolicy,
                  [key]: value,
                },
              }
            : slot,
        ),
      },
    }));
  };

  const handleSlotDependencyRuleChange = (
    day: SchedulerDayOfWeek,
    slotIndex: number,
    key: keyof DaySlotState["deviceDependencyRule"],
    value: string | number,
  ) => {
    setRows((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((slot, index) =>
          index === slotIndex
            ? {
                ...slot,
                deviceDependencyRule: {
                  ...slot.deviceDependencyRule,
                  [key]: value,
                },
              }
            : slot,
        ),
      },
    }));
  };

  const handleAddCondition = (
    day: SchedulerDayOfWeek,
    slotIndex: number,
    groupId: string,
  ) => {
    setRows((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((slot, index) =>
          index === slotIndex
            ? {
                ...slot,
                rule: updateGroupById(slot.rule, groupId, (group) => ({
                  ...group,
                  items: [
                    ...group.items,
                    createAutomationConditionDraft(
                      "provider_primary_power",
                      availableUnits[0] ?? "",
                    ),
                  ],
                })),
              }
            : slot,
        ),
      },
    }));
  };

  const handleAddGroup = (
    day: SchedulerDayOfWeek,
    slotIndex: number,
    groupId: string,
  ) => {
    setRows((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((slot, index) =>
          index === slotIndex
            ? {
                ...slot,
                rule: updateGroupById(slot.rule, groupId, (group) => ({
                  ...group,
                  items: [
                    ...group.items,
                    createAutomationGroupDraft("ANY", [
                      createAutomationConditionDraft(
                        "provider_primary_power",
                        availableUnits[0] ?? "",
                      ),
                    ]),
                  ],
                })),
              }
            : slot,
        ),
      },
    }));
  };

  const handleRemoveRuleNode = (
    day: SchedulerDayOfWeek,
    slotIndex: number,
    nodeId: string,
  ) => {
    setRows((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((slot, index) =>
          index === slotIndex
            ? {
                ...slot,
                rule: removeNodeById(slot.rule, nodeId),
              }
            : slot,
        ),
      },
    }));
  };

  const handleGroupOperatorChange = (
    day: SchedulerDayOfWeek,
    slotIndex: number,
    groupId: string,
    operator: AutomationRuleGroupOperator,
  ) => {
    setRows((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        slots: prev[day].slots.map((slot, index) =>
          index === slotIndex
            ? {
                ...slot,
                rule: updateGroupById(slot.rule, groupId, (group) => ({
                  ...group,
                  operator,
                })),
              }
            : slot,
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
                rule: updateConditionById(slot.rule, conditionId, (condition) => ({
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
                })),
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
                rule: updateConditionById(slot.rule, conditionId, (condition) => ({
                  ...condition,
                  comparator,
                })),
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
                rule: updateConditionById(slot.rule, conditionId, (condition) => ({
                  ...condition,
                  value: nextValue,
                })),
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
                rule: updateConditionById(slot.rule, conditionId, (condition) => ({
                  ...condition,
                  unit: value,
                })),
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
    if (hasInvalidConditions) return;

    const slots = SCHEDULER_DAY_ORDER.flatMap((day) =>
      rows[day].enabled
        ? [...rows[day].slots]
            .sort((a, b) => toMinutes(a.start) - toMinutes(b.start))
            .map((slot) => {
              const activationRule = slot.conditionsEnabled
                ? buildActivationRule(slot.rule, availableUnits)
                : null;
              const persistedPowerCondition = slot.conditionsEnabled
                ? getPersistedPowerCondition(slot.rule, availableUnits)
                : null;
              const startUtc = toUtcTimeForDay(day, slot.start);
              const endUtc = toUtcTimeForDay(day, slot.end);
              const controlPolicy =
                slot.controlMode === "POLICY"
                  ? {
                      policy_type: "TEMPERATURE_HYSTERESIS" as const,
                      sensor_id:
                        slot.controlPolicy.sensorId.trim() ||
                        DEFAULT_TEMPERATURE_POLICY_SENSOR_ID,
                      target_temperature_c:
                        parseDecimalInput(slot.controlPolicy.targetTemperatureC) ?? 65,
                      stop_above_target_delta_c:
                        parseDecimalInput(
                          slot.controlPolicy.stopAboveTargetDeltaC,
                        ) ?? 0,
                      start_below_target_delta_c:
                        parseDecimalInput(
                          slot.controlPolicy.startBelowTargetDeltaC,
                        ) ?? 10,
                      heat_up_on_activate: slot.controlPolicy.heatUpOnActivate,
                      end_behavior: slot.controlPolicy.endBehavior,
                    }
                  : null;
              const deviceDependencyRule =
                slot.deviceDependencyRule.targetDeviceId !== "" &&
                (slot.deviceDependencyRule.whenSourceOn !== "NONE" ||
                  slot.deviceDependencyRule.whenSourceOff !== "NONE")
                  ? {
                      target_device_id: Number(slot.deviceDependencyRule.targetDeviceId),
                      when_source_on: slot.deviceDependencyRule.whenSourceOn,
                      when_source_off: slot.deviceDependencyRule.whenSourceOff,
                    }
                  : null;

              return {
                day_of_week: day,
                start_local_time: slot.start,
                end_local_time: slot.end,
                start_utc_time: startUtc,
                end_utc_time: endUtc,
                start_time: startUtc,
                end_time: endUtc,
                use_power_threshold: persistedPowerCondition != null,
                power_threshold_value: persistedPowerCondition?.parsedValue ?? null,
                power_threshold_unit: persistedPowerCondition?.condition.unit ?? null,
                control_mode: slot.controlMode,
                control_policy: controlPolicy,
                device_dependency_rule: deviceDependencyRule,
                activation_rule: activationRule,
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

        {validationMessages.length > 0 && (
          <Alert severity="error">
            <Stack spacing={0.25}>
              <Typography variant="body2" fontWeight={600}>
                {t("schedulers.form.validationSummary")}
              </Typography>
              {validationMessages.map((message) => (
                <Typography key={message} variant="body2">
                  {message}
                </Typography>
              ))}
            </Stack>
          </Alert>
        )}

        {unitsLoadError && <Alert severity="warning">{unitsLoadError}</Alert>}

        {hasAdvancedPreviewWarning && (
          <Alert severity="info">{t("schedulers.form.previewWarning")}</Alert>
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

                      const ruleValidation = slotRuleValidations[day][slotIndex];
                      const conditionsError =
                        slot.conditionsEnabled &&
                        (ruleValidation.hasInvalidCondition ||
                          ruleValidation.hasEmptyGroup);
                      const slotError = submitted && (rangeError || conditionsError);

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

                            <SchedulerRuleTreeBuilder
                              title={t("schedulers.form.slotRuleTitle")}
                              description={t("schedulers.form.slotRuleDescription")}
                              enabled={slot.conditionsEnabled}
                              onEnabledChange={(checked) =>
                                handleSlotConditionsToggle(day, slotIndex, checked)
                              }
                              rule={slot.rule}
                              onGroupOperatorChange={(groupId, operator) =>
                                handleGroupOperatorChange(
                                  day,
                                  slotIndex,
                                  groupId,
                                  operator,
                                )
                              }
                              onAddCondition={(groupId) =>
                                handleAddCondition(day, slotIndex, groupId)
                              }
                              onAddGroup={(groupId) =>
                                handleAddGroup(day, slotIndex, groupId)
                              }
                              onRemoveNode={(nodeId) =>
                                handleRemoveRuleNode(day, slotIndex, nodeId)
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
                              showValidation={submitted && slot.conditionsEnabled}
                              validation={{
                                groupErrors: Object.fromEntries(
                                  Object.entries(ruleValidation.groupErrors).map(
                                    ([groupId, code]) => [
                                      groupId,
                                      code === "empty"
                                        ? t("automation.validation.groupEmpty")
                                        : undefined,
                                    ],
                                  ),
                                ),
                                conditionErrors: Object.fromEntries(
                                  Object.entries(
                                    ruleValidation.conditionErrors,
                                  ).map(([conditionId, errors]) => [
                                    conditionId,
                                    {
                                      value: getConditionFieldErrorText(
                                        errors.value,
                                      ),
                                      unit: getUnitFieldErrorText(errors.unit),
                                    },
                                  ]),
                                ),
                              }}
                              toggleLabel={t(
                                "schedulers.form.enableSlotConditions",
                              )}
                            />

                            {submitted && conditionsError && (
                              <Alert severity="error" sx={{ py: 0.5 }}>
                                {t("schedulers.form.persistablePowerRequired")}
                              </Alert>
                            )}

                            <Box
                              sx={{
                                p: 1,
                                borderRadius: 1.5,
                                border: "1px solid",
                                borderColor: "divider",
                              }}
                            >
                              <Stack spacing={1}>
                                <Typography variant="subtitle2" fontWeight={600}>
                                  {t("schedulers.form.controlTitle")}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {t("schedulers.form.controlDescription")}
                                </Typography>

                                <FormControl size="small" sx={textFieldSx}>
                                  <InputLabel>
                                    {t("schedulers.form.controlMode")}
                                  </InputLabel>
                                  <Select
                                    label={t("schedulers.form.controlMode")}
                                    value={slot.controlMode}
                                    onChange={(event) =>
                                      handleSlotControlModeChange(
                                        day,
                                        slotIndex,
                                        event.target.value as SchedulerControlMode,
                                      )
                                    }
                                    disabled={loading}
                                  >
                                    <MenuItem value="DIRECT">
                                      {t("schedulers.form.controlModeDirect")}
                                    </MenuItem>
                                    <MenuItem value="POLICY">
                                      {t("schedulers.form.controlModePolicy")}
                                    </MenuItem>
                                  </Select>
                                </FormControl>

                                {slot.controlMode === "POLICY" && (
                                  <Stack spacing={1.25}>
                                    <Alert severity="info" sx={{ py: 0.5 }}>
                                      {t("schedulers.form.temperatureSensorDescription")}
                                    </Alert>
                                    <TextField
                                      label={t("schedulers.form.requiredSensor")}
                                      size="small"
                                      value={t(
                                        "schedulers.form.requiredSensorTemperature",
                                      )}
                                      InputProps={{ readOnly: true }}
                                      sx={textFieldSx}
                                    />
                                    <Box
                                      sx={{
                                        display: "grid",
                                        gridTemplateColumns: {
                                          xs: "1fr",
                                          sm: "repeat(2, minmax(0, 1fr))",
                                        },
                                        gap: 1,
                                      }}
                                    >
                                    <TextField
                                      label={t("schedulers.form.targetTemperature")}
                                      size="small"
                                      value={slot.controlPolicy.targetTemperatureC}
                                      onChange={(event) =>
                                        handleSlotControlPolicyChange(
                                          day,
                                          slotIndex,
                                          "targetTemperatureC",
                                          event.target.value,
                                        )
                                      }
                                      sx={textFieldSx}
                                    />
                                    <TextField
                                      label={t("schedulers.form.stopDelta")}
                                      size="small"
                                      value={slot.controlPolicy.stopAboveTargetDeltaC}
                                      onChange={(event) =>
                                        handleSlotControlPolicyChange(
                                          day,
                                          slotIndex,
                                          "stopAboveTargetDeltaC",
                                          event.target.value,
                                        )
                                      }
                                      sx={textFieldSx}
                                    />
                                    <TextField
                                      label={t("schedulers.form.startDelta")}
                                      size="small"
                                      value={slot.controlPolicy.startBelowTargetDeltaC}
                                      onChange={(event) =>
                                        handleSlotControlPolicyChange(
                                          day,
                                          slotIndex,
                                          "startBelowTargetDeltaC",
                                          event.target.value,
                                        )
                                      }
                                      sx={textFieldSx}
                                    />
                                    <FormControl size="small" sx={textFieldSx}>
                                      <InputLabel>
                                        {t("schedulers.form.endBehavior")}
                                      </InputLabel>
                                      <Select
                                        label={t("schedulers.form.endBehavior")}
                                        value={slot.controlPolicy.endBehavior}
                                        onChange={(event) =>
                                          handleSlotControlPolicyChange(
                                            day,
                                            slotIndex,
                                            "endBehavior",
                                            event.target.value,
                                          )
                                        }
                                      >
                                        <MenuItem value="FORCE_OFF">
                                          {t("schedulers.form.endBehaviorForceOff")}
                                        </MenuItem>
                                        <MenuItem value="KEEP_CURRENT_STATE">
                                          {t("schedulers.form.endBehaviorKeepState")}
                                        </MenuItem>
                                      </Select>
                                    </FormControl>
                                    <FormControlLabel
                                      control={
                                        <Switch
                                          checked={
                                            slot.controlPolicy.heatUpOnActivate
                                          }
                                          onChange={(_, checked) =>
                                            handleSlotControlPolicyChange(
                                              day,
                                              slotIndex,
                                              "heatUpOnActivate",
                                              checked,
                                            )
                                          }
                                        />
                                      }
                                      label={t("schedulers.form.heatUpOnActivate")}
                                    />
                                    </Box>
                                  </Stack>
                                )}

                                <Stack spacing={1.25}>
                                  <Typography variant="subtitle2" fontWeight={600}>
                                    {t("schedulers.form.deviceDependencyTitle")}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {t("schedulers.form.deviceDependencyDescription")}
                                  </Typography>

                                  <FormControl fullWidth size="small" sx={textFieldSx}>
                                    <InputLabel>
                                      {t("schedulers.form.deviceDependencyTarget")}
                                    </InputLabel>
                                    <Select
                                      label={t("schedulers.form.deviceDependencyTarget")}
                                      value={slot.deviceDependencyRule.targetDeviceId}
                                      onChange={(event) => {
                                        const nextValue = String(event.target.value);
                                        handleSlotDependencyRuleChange(
                                          day,
                                          slotIndex,
                                          "targetDeviceId",
                                          nextValue === "" ? "" : Number(nextValue),
                                        );
                                      }}
                                      disabled={devicesLoading}
                                    >
                                      <MenuItem value="">
                                        <em>{t("common.selectPlaceholder")}</em>
                                      </MenuItem>
                                      {availableDevices.map((entry) => (
                                        <MenuItem key={entry.id} value={entry.id}>
                                          {`${entry.name} (GPIO ${entry.device_number})`}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>

                                  <Box
                                    sx={{
                                      display: "grid",
                                      gridTemplateColumns: {
                                        xs: "1fr",
                                        sm: "repeat(2, minmax(0, 1fr))",
                                      },
                                      gap: 1,
                                    }}
                                  >
                                    <FormControl fullWidth size="small" sx={textFieldSx}>
                                      <InputLabel>
                                        {t("schedulers.form.whenSourceOn")}
                                      </InputLabel>
                                      <Select
                                        label={t("schedulers.form.whenSourceOn")}
                                        value={slot.deviceDependencyRule.whenSourceOn}
                                        onChange={(event) =>
                                          handleSlotDependencyRuleChange(
                                            day,
                                            slotIndex,
                                            "whenSourceOn",
                                            event.target.value,
                                          )
                                        }
                                      >
                                        {DEPENDENCY_ACTION_OPTIONS.map((action) => (
                                          <MenuItem key={action} value={action}>
                                            {t(`devices.form.dependencyActions.${action}`)}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>

                                    <FormControl fullWidth size="small" sx={textFieldSx}>
                                      <InputLabel>
                                        {t("schedulers.form.whenSourceOff")}
                                      </InputLabel>
                                      <Select
                                        label={t("schedulers.form.whenSourceOff")}
                                        value={slot.deviceDependencyRule.whenSourceOff}
                                        onChange={(event) =>
                                          handleSlotDependencyRuleChange(
                                            day,
                                            slotIndex,
                                            "whenSourceOff",
                                            event.target.value,
                                          )
                                        }
                                      >
                                        {DEPENDENCY_ACTION_OPTIONS.map((action) => (
                                          <MenuItem key={action} value={action}>
                                            {t(`devices.form.dependencyActions.${action}`)}
                                          </MenuItem>
                                        ))}
                                      </Select>
                                    </FormControl>
                                  </Box>

                                  {devicesLoadError && (
                                    <Alert severity="warning">{devicesLoadError}</Alert>
                                  )}
                                </Stack>
                              </Stack>
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

        {submitError && <Alert severity="error">{submitError}</Alert>}

        {!hideActions && (
          <Box display="flex" justifyContent="flex-end" gap={1}>
            <Button variant="outlined" onClick={onCancel} disabled={loading}>
              {t("common.cancel")}
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
              startIcon={
                loading ? <CircularProgress size={16} color="inherit" /> : undefined
              }
            >
              {loading ? t("common.loading") : t("common.save")}
            </Button>
          </Box>
        )}
      </Stack>
    </Box>
  );
}
