import {
  Alert,
  Box,
  Card,
  CardContent,
  Divider,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
  Button,
} from "@mui/material";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import type { Device } from "@/features/devices/types/devicesType";
import type {
  DeviceDependencyAction,
  DeviceDependencyRule,
} from "@/features/devices/types/dependency";
import {
  type AutomationRuleComparator,
  type AutomationRuleConditionDraft,
  type AutomationRuleConditionPayload,
  type AutomationRuleGroupDraft,
  type AutomationRuleGroupOperator,
  type AutomationRuleGroupPayload,
  type AutomationRuleNodeDraft,
  type AutomationRuleNodePayload,
  type AutomationRuleSource,
  createAutomationConditionDraft,
  createAutomationGroupDraft,
  isAutomationRuleGroupDraft,
  isAutomationRuleGroupPayload,
  isBatteryRuleSource,
  isPowerRuleSource,
} from "@/features/automation/types/rules";
import type { ProviderResponse } from "@/features/providers/types/userProvider";
import type { DeviceMode } from "@/features/devices/enums/deviceMode";
import type { Scheduler } from "@/features/schedulers/types/scheduler";
import { SchedulerRuleTreeBuilder } from "@/features/schedulers/components/SchedulerRuleTreeBuilder";
import { useDeviceActions } from "@/features/devices/hooks/useDeviceActions";
import { devicesApi } from "@/api/devicesApi";
import { parseApiError } from "@/api/parseApiError";
import { useToast } from "@/context/ToastContext";
import { schedulersApi } from "@/api/schedulersApi";
import {
  getSlotDependencyRule,
  hasTemperatureSensorCapability,
  schedulerUsesDeviceDependency,
  schedulerUsesTemperaturePolicy,
} from "@/features/schedulers/utils/policy";

export type DeviceFormValues = {
  name: string;
  mode: DeviceMode;
  thresholdValue?: number | null;
  autoRule?: AutomationRuleGroupPayload | null;
  deviceDependencyRule?: DeviceDependencyRule | null;
  schedulerId?: number | null;
};

type Props = {
  device?: Device;
  provider?: ProviderResponse | null;
  microcontrollerOnline: boolean;
  onSubmit?: (values: DeviceFormValues) => Promise<void> | void;
  onSubmittingChange?: (submitting: boolean) => void;
  formId?: string;
  hideActions?: boolean;
  variant?: "panel" | "modal";
  microcontrollerUuid?: string;
  onCancel?: () => void;
  existingDevices?: Device[];
  maxDevices?: number;
  assignedSensors?: string[];
};

const getNextDeviceNumber = (
  device: Device | undefined,
  existingDevices: Device[] | undefined,
  maxDevices: number | undefined,
) => {
  if (device?.device_number != null) {
    return device.device_number;
  }

  const used = new Set((existingDevices ?? []).map((d) => d.device_number));
  const upperBound = maxDevices ?? Math.max(used.size + 1, 1);
  for (let i = 1; i <= upperBound; i += 1) {
    if (!used.has(i)) return i;
  }
  return upperBound + 1;
};
const BLANK_HELPER = " ";
const DECIMAL_INPUT_PATTERN = /^[0-9]*([.,][0-9]*)?$/;
const DEPENDENCY_ACTION_OPTIONS: DeviceDependencyAction[] = ["NONE", "ON", "OFF"];

const parseDecimalInput = (value: string): number | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
};

const normalizeRulePayload = (
  rule: AutomationRuleGroupPayload | null | undefined,
): AutomationRuleGroupPayload | null => {
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
};

const createDraftRuleFromPayload = (
  rule: AutomationRuleGroupPayload,
): AutomationRuleGroupDraft =>
  createAutomationGroupDraft(
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

const toEditableAutoRule = (
  device?: Device,
): AutomationRuleGroupPayload | null =>
  normalizeRulePayload(device?.auto_rule ?? device?.auto_rule_json);

const createInitialAutoRule = (
  device: Device | undefined,
  powerUnit: string,
  thresholdValue?: number | null,
): AutomationRuleGroupDraft => {
  const autoRule = toEditableAutoRule(device);
  if (autoRule) {
    return createDraftRuleFromPayload(autoRule);
  }

  return createDefaultAutoRule(powerUnit, thresholdValue);
};

const getEditableDependencyRule = (
  device: Device | undefined,
): DeviceDependencyRule | null => device?.device_dependency_rule ?? null;

const validateAutoCondition = (
  condition: AutomationRuleConditionDraft,
  availableUnits: string[],
): AutoConditionValidation => {
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
};

const validateAutoRuleDraft = (
  group: AutomationRuleGroupDraft,
  availableUnits: string[],
): AutoRuleValidation => {
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
        const nested = validateAutoRuleDraft(item, availableUnits);
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

      const validation = validateAutoCondition(item, availableUnits);
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
};

const buildAutoRulePayload = (
  group: AutomationRuleGroupDraft,
  availableUnits: string[],
): AutomationRuleGroupPayload | null => {
  const items = group.items.flatMap((item): AutomationRuleNodePayload[] => {
    if (isAutomationRuleGroupDraft(item)) {
      const nested = buildAutoRulePayload(item, availableUnits);
      return nested ? [nested] : [];
    }

    const validation = validateAutoCondition(item, availableUnits);
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
};

const isConditionPayload = (
  item: AutomationRuleNodePayload,
): item is AutomationRuleConditionPayload => "source" in item;

const isLegacyPowerOnlyRule = (rule: AutomationRuleGroupPayload | null): boolean => {
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
};

const getPersistedAutoPowerCondition = (
  group: AutomationRuleGroupDraft,
  availableUnits: string[],
) => {
  const autoRule = buildAutoRulePayload(group, availableUnits);
  if (!isLegacyPowerOnlyRule(autoRule)) {
    return null;
  }

  const [condition] = autoRule.items ?? [];
  if (!condition || !isConditionPayload(condition)) {
    return null;
  }

  return {
    condition,
    parsedValue: condition.value,
  };
};

const isLegacyPowerOnlyDraft = (group: AutomationRuleGroupDraft): boolean => {
  if (group.operator !== "ANY" || group.items.length !== 1) {
    return false;
  }

  const [item] = group.items;
  return (
    !isAutomationRuleGroupDraft(item) &&
    item.source === "provider_primary_power" &&
    item.comparator === "gte"
  );
};

const updateGroupById = (
  group: AutomationRuleGroupDraft,
  targetGroupId: string,
  updater: (currentGroup: AutomationRuleGroupDraft) => AutomationRuleGroupDraft,
): AutomationRuleGroupDraft => {
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
};

const updateConditionById = (
  group: AutomationRuleGroupDraft,
  targetConditionId: string,
  updater: (
    condition: AutomationRuleConditionDraft,
  ) => AutomationRuleConditionDraft,
): AutomationRuleGroupDraft => {
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
};

const removeNodeById = (
  group: AutomationRuleGroupDraft,
  targetNodeId: string,
): AutomationRuleGroupDraft => {
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
};

type AutoConditionValidation = {
  parsedValue: number | null;
  errors: {
    value?: "required" | "invalid" | "batteryRange";
    unit?: "required" | "invalid";
  };
};

type AutoRuleValidation = {
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

const createDefaultAutoRule = (
  powerUnit: string,
  thresholdValue?: number | null,
): AutomationRuleGroupDraft =>
  createAutomationGroupDraft("ANY", [
    {
      ...createAutomationConditionDraft("provider_primary_power", powerUnit),
      value: thresholdValue != null ? String(thresholdValue) : "",
    },
  ]);

export function DeviceForm({
  device,
  provider,
  microcontrollerOnline,
  onSubmit,
  onSubmittingChange,
  formId,
  hideActions = false,
  variant = "panel",
  microcontrollerUuid,
  onCancel,
  existingDevices,
  maxDevices,
  assignedSensors,
}: Props) {
  const { t } = useTranslation();
  const tt = t as (key: string, options?: Record<string, unknown>) => string;
  const { notifyError } = useToast();
  const { setManualState, manualSaving, error, clearError } =
    useDeviceActions();
  const hasError = Boolean(error);
  const manualErrorMessage = hasError
    ? parseApiError(error).message || tt("errors.api.generic")
    : null;

  const [name, setName] = useState(device?.name ?? "");
  const [mode, setMode] = useState<DeviceMode>(device?.mode ?? "AUTO");
  const [deviceNumber, setDeviceNumber] = useState<number>(
    getNextDeviceNumber(device, existingDevices, maxDevices),
  );
  const [ratedPower, setRatedPower] = useState<string>(
    device?.rated_power != null ? String(device.rated_power) : "",
  );
  const [manualState, setManualStateValue] = useState<boolean>(
    device?.manual_state ?? false,
  );
  const [schedulerId, setSchedulerId] = useState<number | "">(
    device?.scheduler_id ?? "",
  );
  const [schedulers, setSchedulers] = useState<Scheduler[]>([]);
  const [schedulersLoading, setSchedulersLoading] = useState(true);
  const [schedulersLoadError, setSchedulersLoadError] = useState<string | null>(
    null,
  );
  const [dependencyTargetId, setDependencyTargetId] = useState<number | "">(
    getEditableDependencyRule(device)?.target_device_id ?? "",
  );
  const [dependencyWhenSourceOn, setDependencyWhenSourceOn] =
    useState<DeviceDependencyAction>(
      getEditableDependencyRule(device)?.when_source_on ?? "NONE",
    );
  const [dependencyWhenSourceOff, setDependencyWhenSourceOff] =
    useState<DeviceDependencyAction>(
      getEditableDependencyRule(device)?.when_source_off ?? "NONE",
    );
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    onSubmittingChange?.(submitting);
  }, [onSubmittingChange, submitting]);

  useEffect(() => {
    let cancelled = false;

    const loadSchedulers = async () => {
      setSchedulersLoading(true);
      setSchedulersLoadError(null);

      try {
        const response = await schedulersApi.list();
        if (cancelled) return;
        setSchedulers(response.data);
      } catch (error) {
        if (cancelled) return;
        setSchedulersLoadError(parseApiError(error).message || tt("errors.api.generic"));
      } finally {
        if (!cancelled) {
          setSchedulersLoading(false);
        }
      }
    };

    void loadSchedulers();

    return () => {
      cancelled = true;
    };
  }, [tt]);

  const isManual = mode === "MANUAL";
  const isAuto = mode === "AUTO";
  const isSchedule = mode === "SCHEDULE";
  const canUseForm = microcontrollerOnline && Boolean(provider);
  const isAtCapacity =
    !device &&
    maxDevices != null &&
    (existingDevices?.length ?? 0) >= maxDevices;
  const ratedPowerNumber = parseDecimalInput(ratedPower);
  const isRatedPowerValid = ratedPowerNumber != null;

  const thresholdUnit = provider?.unit ?? null;
  const autoPowerUnits = useMemo(
    () => (thresholdUnit ? [thresholdUnit] : ["W"]),
    [thresholdUnit],
  );
  const hasTemperatureSensor = useMemo(
    () => hasTemperatureSensorCapability(assignedSensors),
    [assignedSensors],
  );
  const unavailableInboundTargetIds = useMemo(() => {
    const used = new Set<number>();
    const otherDevices = (existingDevices ?? []).filter((entry) => entry.id !== device?.id);

    otherDevices.forEach((entry) => {
      const rule = entry.device_dependency_rule;
      if (rule?.target_device_id != null) {
        used.add(rule.target_device_id);
      }

      if (entry.mode === "SCHEDULE" && entry.scheduler_id != null) {
        const scheduler = schedulers.find((item) => item.id === entry.scheduler_id);
        scheduler?.slots?.forEach((slot) => {
          const targetId = getSlotDependencyRule(slot)?.target_device_id;
          if (targetId != null) {
            used.add(targetId);
          }
        });
      }
    });

    return used;
  }, [device?.id, existingDevices, schedulers]);
  const schedulerCompatibility = useMemo(
    () =>
      new Map(
        schedulers.map((scheduler) => {
          const requiresTemperatureSensor =
            schedulerUsesTemperaturePolicy(scheduler);
          const schedulerDependencyTargets = (scheduler.slots ?? [])
            .map((slot) => getSlotDependencyRule(slot)?.target_device_id ?? null)
            .filter((value): value is number => value != null);
          const isSameMicrocontrollerTargetSetValid = schedulerDependencyTargets.every(
            (targetId) => (existingDevices ?? []).some((entry) => entry.id === targetId),
          );
          const usesCurrentDeviceAsTarget =
            device?.id != null && schedulerDependencyTargets.includes(device.id);
          const hasInboundConflict = schedulerDependencyTargets.some((targetId) =>
            unavailableInboundTargetIds.has(targetId),
          );
          return [
            scheduler.id,
            {
              requiresTemperatureSensor,
              requiresDeviceDependency: schedulerUsesDeviceDependency(scheduler),
              compatible:
                (!requiresTemperatureSensor || hasTemperatureSensor) &&
                isSameMicrocontrollerTargetSetValid &&
                !usesCurrentDeviceAsTarget &&
                !hasInboundConflict,
            },
          ] as const;
        }),
      ),
    [device?.id, existingDevices, hasTemperatureSensor, schedulers, unavailableInboundTargetIds],
  );
  const selectedSchedulerCompatibility =
    schedulerId === "" ? null : schedulerCompatibility.get(Number(schedulerId)) ?? null;
  const dependencyTargetOptions = useMemo(
    () =>
      (existingDevices ?? []).filter(
        (entry) =>
          entry.id !== device?.id && !unavailableInboundTargetIds.has(entry.id),
      ),
    [device?.id, existingDevices, unavailableInboundTargetIds],
  );
  const dependencyRuleEnabled =
    dependencyTargetId !== "" &&
    (dependencyWhenSourceOn !== "NONE" || dependencyWhenSourceOff !== "NONE");
  const selectedDependencyTargetUnavailable =
    dependencyTargetId !== "" &&
    !dependencyTargetOptions.some((entry) => entry.id === Number(dependencyTargetId));
  const [autoRule, setAutoRule] = useState<AutomationRuleGroupDraft>(
    createInitialAutoRule(
      device,
      autoPowerUnits[0] ?? "W",
      device?.threshold_value ?? provider?.value_min ?? 0,
    ),
  );
  const fieldSx = {
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
    "& .MuiFormHelperText-root": {
      color: "#dc2626",
    },
  };

  useEffect(() => {
    setName(device?.name ?? "");
    setMode(device?.mode ?? "AUTO");
    setDeviceNumber(getNextDeviceNumber(device, existingDevices, maxDevices));
    setRatedPower(
      device?.rated_power != null ? String(device.rated_power) : "",
    );
    setManualStateValue(device?.manual_state ?? false);
    setAutoRule(
      createInitialAutoRule(
        device,
        autoPowerUnits[0] ?? "W",
        device?.threshold_value ?? provider?.value_min ?? 0,
      ),
    );
    setDependencyTargetId(getEditableDependencyRule(device)?.target_device_id ?? "");
    setDependencyWhenSourceOn(
      getEditableDependencyRule(device)?.when_source_on ?? "NONE",
    );
    setDependencyWhenSourceOff(
      getEditableDependencyRule(device)?.when_source_off ?? "NONE",
    );
    setSchedulerId(device?.scheduler_id ?? "");
    setSubmitted(false);
    setSubmitError(null);
  }, [autoPowerUnits, device, existingDevices, maxDevices, provider?.value_min]);

  const autoRuleValidation = useMemo(
    () => validateAutoRuleDraft(autoRule, autoPowerUnits),
    [autoPowerUnits, autoRule],
  );

  const autoRuleValid = useMemo(
    () =>
      !autoRuleValidation.hasInvalidCondition && !autoRuleValidation.hasEmptyGroup,
    [autoRuleValidation],
  );

  const persistedAutoPowerCondition = useMemo(
    () => getPersistedAutoPowerCondition(autoRule, autoPowerUnits),
    [autoPowerUnits, autoRule],
  );

  const autoAdvancedPreviewWarning = useMemo(
    () => !isLegacyPowerOnlyDraft(autoRule),
    [autoRule],
  );

  const handleManualToggle = async (next: boolean) => {
    if (!device?.id) return;
    clearError();
    try {
      const res = await setManualState(device.id, next);
      const payload = res ?? null;
      const nextDevice = payload?.device ?? null;
      const nextState =
        typeof nextDevice?.manual_state === "boolean"
          ? nextDevice.manual_state
          : typeof nextDevice?.is_on === "boolean"
            ? nextDevice.is_on
            : typeof payload?.is_on === "boolean"
              ? payload.is_on
              : next;
      setManualStateValue(nextState);
      if (nextDevice?.mode) {
        setMode(nextDevice.mode as DeviceMode);
      }
    } catch (err) {
      notifyError(parseApiError(err).message || tt("errors.api.generic"));
    }
  };

  const handleAutoGroupOperatorChange = (
    groupId: string,
    operator: AutomationRuleGroupOperator,
  ) => {
    setAutoRule((prev) =>
      updateGroupById(prev, groupId, (group) => ({
        ...group,
        operator,
      })),
    );
  };

  const handleAddAutoCondition = (groupId: string) => {
    setAutoRule((prev) =>
      updateGroupById(prev, groupId, (group) => ({
        ...group,
        items: [
          ...group.items,
          createAutomationConditionDraft(
            "provider_primary_power",
            autoPowerUnits[0] ?? "W",
          ),
        ],
      })),
    );
  };

  const handleAddAutoGroup = (groupId: string) => {
    setAutoRule((prev) =>
      updateGroupById(prev, groupId, (group) => ({
        ...group,
        items: [...group.items, createAutomationGroupDraft("ALL")],
      })),
    );
  };

  const handleRemoveAutoRuleNode = (nodeId: string) => {
    setAutoRule((prev) => removeNodeById(prev, nodeId));
  };

  const handleAutoConditionSourceChange = (
    conditionId: string,
    source: AutomationRuleSource,
  ) => {
    setAutoRule((prev) =>
      updateConditionById(prev, conditionId, (condition) => ({
        ...condition,
        source,
        comparator: "gte",
        value: source === "provider_battery_soc" ? "30" : condition.value,
        unit:
          source === "provider_battery_soc"
            ? "%"
            : autoPowerUnits[0] ?? condition.unit,
      })),
    );
  };

  const handleAutoConditionComparatorChange = (
    conditionId: string,
    comparator: AutomationRuleComparator,
  ) => {
    setAutoRule((prev) =>
      updateConditionById(prev, conditionId, (condition) => ({
        ...condition,
        comparator,
      })),
    );
  };

  const handleAutoConditionValueChange = (
    conditionId: string,
    value: string,
  ) => {
    const nextValue = value.replace(/\s+/g, "");
    if (nextValue !== "" && !DECIMAL_INPUT_PATTERN.test(nextValue)) {
      return;
    }

    setAutoRule((prev) =>
      updateConditionById(prev, conditionId, (condition) => ({
        ...condition,
        value: nextValue,
      })),
    );
  };

  const handleAutoConditionUnitChange = (
    conditionId: string,
    unit: string,
  ) => {
    setAutoRule((prev) =>
      updateConditionById(prev, conditionId, (condition) => ({
        ...condition,
        unit,
      })),
    );
  };

  const handleSubmit = async () => {
    if (!onSubmit) return;
    if (submitting) return;
    setSubmitError(null);
    setSubmitted(true);
    if (isAtCapacity) return;
    if (!name.trim()) return;
    if (isAuto && !autoRuleValid) {
      return;
    }
    if (isSchedule && (schedulerId === "" || Number.isNaN(Number(schedulerId)))) {
      return;
    }
    if (isSchedule && selectedSchedulerCompatibility?.compatible === false) {
      setSubmitError(
        selectedSchedulerCompatibility.requiresTemperatureSensor && !hasTemperatureSensor
          ? tt("devices.form.schedulerTemperatureMissing")
          : tt("devices.form.schedulerDependencyMissing"),
      );
      return;
    }
    if (isAuto && dependencyRuleEnabled && selectedDependencyTargetUnavailable) {
      setSubmitError(tt("devices.form.dependencyConflict"));
      return;
    }
    if (deviceNumber == null || Number.isNaN(deviceNumber)) return;
    if (!isRatedPowerValid) return;
    const autoRulePayload = isAuto ? buildAutoRulePayload(autoRule, autoPowerUnits) : null;
    const dependencyRulePayload =
      isAuto && dependencyRuleEnabled
        ? {
            target_device_id: Number(dependencyTargetId),
            when_source_on: dependencyWhenSourceOn,
            when_source_off: dependencyWhenSourceOff,
          }
        : null;
    setSubmitting(true);
    try {
      if (device?.id) {
        await devicesApi.updateDevice(device.id, {
          name: name.trim(),
          device_number: deviceNumber,
          mode,
          threshold_value: isAuto
            ? persistedAutoPowerCondition?.parsedValue ?? null
            : null,
          auto_rule: isAuto ? autoRulePayload : null,
          device_dependency_rule: dependencyRulePayload,
          scheduler_id: isSchedule ? Number(schedulerId) : null,
          rated_power: ratedPowerNumber,
        });
      } else if (microcontrollerUuid) {
        await devicesApi.createDevice(microcontrollerUuid, {
          name: name.trim(),
          device_number: deviceNumber,
          mode,
          threshold_value: isAuto
            ? persistedAutoPowerCondition?.parsedValue ?? null
            : null,
          auto_rule: isAuto ? autoRulePayload : null,
          device_dependency_rule: dependencyRulePayload,
          scheduler_id: isSchedule ? Number(schedulerId) : null,
          rated_power: ratedPowerNumber,
        });
      }
      await onSubmit({
        name: name.trim(),
        mode,
        thresholdValue: isAuto
          ? persistedAutoPowerCondition?.parsedValue ?? null
          : null,
        autoRule: isAuto ? autoRulePayload : null,
        deviceDependencyRule: dependencyRulePayload,
        schedulerId: isSchedule ? Number(schedulerId) : null,
      });
    } catch (err) {
      const parsed = parseApiError(err);
      const message = tt("devices.form.submitError", {
        message: parsed.message || tt("errors.api.generic"),
      });
      setSubmitError(message);
      notifyError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFormSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleSubmit();
  };

  if (!microcontrollerOnline) {
    return (
      <Typography variant="body2" color="text.secondary">
        {tt("microcontroller.offlineWarning")}
      </Typography>
    );
  }

  if (!provider) {
    return (
      <Typography variant="body2" color="text.secondary">
        {tt("providers.empty.description")}
      </Typography>
    );
  }

  const content = (
    <Box component="form" id={formId} onSubmit={handleFormSubmit}>
      <Stack spacing={2.5}>
      <Stack spacing={0.5}>
        <Typography variant="subtitle1" fontWeight={700}>
          {tt("common.add")}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {tt("common.configuration")}
        </Typography>
      </Stack>

      <Stack spacing={2}>
        <TextField
          label={tt("microcontroller.form.name")}
          size="small"
          value={name}
          onChange={(event) => setName(event.target.value)}
          fullWidth
          sx={fieldSx}
          required
          error={submitted && !name.trim()}
          helperText={
            submitted && !name.trim() ? tt("errors.validation.required") : " "
          }
        />

        <FormControl fullWidth size="small" sx={fieldSx}>
          <InputLabel>{tt("common.configuration")}</InputLabel>
          <Select
            label={tt("common.configuration")}
            value={mode}
            onChange={(event) => setMode(event.target.value as DeviceMode)}
          >
            <MenuItem value="AUTO">{tt("devices.details.modes.auto")}</MenuItem>
            <MenuItem value="MANUAL">
              {tt("devices.details.modes.manual")}
            </MenuItem>
            <MenuItem value="SCHEDULE">
              {tt("devices.details.modes.schedule")}
            </MenuItem>
          </Select>
        </FormControl>

        <TextField
          label={tt("devices.form.gpio")}
          size="small"
          type="number"
          value={deviceNumber}
          fullWidth
          sx={fieldSx}
          required
          inputProps={{ min: 1, step: 1, readOnly: true }}
          disabled
          error={
            submitted && (deviceNumber == null || Number.isNaN(deviceNumber))
          }
          helperText={
            submitted && (deviceNumber == null || Number.isNaN(deviceNumber))
              ? tt("errors.validation.required")
              : " "
          }
        />

        <TextField
          label={`${tt("devices.ratedPower")} (${provider?.unit ?? "W"})`}
          size="small"
          type="text"
          value={ratedPower}
          onChange={(event) => {
            const nextValue = event.target.value.replace(/\s+/g, "");
            if (nextValue === "" || DECIMAL_INPUT_PATTERN.test(nextValue)) {
              setRatedPower(nextValue);
            }
          }}
          fullWidth
          sx={fieldSx}
          inputProps={{ inputMode: "decimal", pattern: "[0-9]*[.,]?[0-9]*" }}
          required
          error={submitted && !isRatedPowerValid}
          helperText={
            submitted && !isRatedPowerValid
              ? tt("errors.validation.required")
              : " "
          }
        />
      </Stack>

      {isManual ? (
        <Stack spacing={1}>
          <Typography variant="subtitle2" fontWeight={600}>
            {`${tt("common.enabled")} / ${tt("common.disabled")}`}
          </Typography>
          <FormControlLabel
            control={
              <Switch
                checked={manualState}
                disabled={!microcontrollerOnline || manualSaving || !device?.id}
                onChange={(_, next) => handleManualToggle(next)}
              />
            }
            label={manualState ? tt("common.enabled") : tt("common.disabled")}
          />
          {manualErrorMessage && (
            <Typography variant="caption" color="error">
              {manualErrorMessage}
            </Typography>
          )}
        </Stack>
      ) : isAuto ? (
        <Stack spacing={2}>
          <Box
            sx={{
              p: 1.5,
              borderRadius: 1.5,
              border: "1px solid",
              borderColor: "divider",
            }}
          >
            <Stack spacing={1.5}>
              <Typography variant="subtitle2" fontWeight={600}>
                {tt("devices.form.dependencyTitle")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {tt("devices.form.dependencyDescription")}
              </Typography>

              <FormControl
                fullWidth
                size="small"
                sx={fieldSx}
                error={submitted && dependencyRuleEnabled && selectedDependencyTargetUnavailable}
              >
                <InputLabel>{tt("devices.form.dependencyTarget")}</InputLabel>
                <Select
                  label={tt("devices.form.dependencyTarget")}
                  value={dependencyTargetId}
                  onChange={(event) => {
                    const nextValue = String(event.target.value);
                    setDependencyTargetId(nextValue === "" ? "" : Number(nextValue));
                  }}
                >
                  <MenuItem value="">
                    <em>{tt("common.selectPlaceholder")}</em>
                  </MenuItem>
                  {dependencyTargetOptions.map((entry) => (
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
                  gap: 2,
                }}
              >
                <FormControl fullWidth size="small" sx={fieldSx}>
                  <InputLabel>{tt("devices.form.whenSourceOn")}</InputLabel>
                  <Select
                    label={tt("devices.form.whenSourceOn")}
                    value={dependencyWhenSourceOn}
                    onChange={(event) =>
                      setDependencyWhenSourceOn(
                        event.target.value as DeviceDependencyAction,
                      )
                    }
                  >
                    {DEPENDENCY_ACTION_OPTIONS.map((action) => (
                      <MenuItem key={action} value={action}>
                        {tt(`devices.form.dependencyActions.${action}`)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl fullWidth size="small" sx={fieldSx}>
                  <InputLabel>{tt("devices.form.whenSourceOff")}</InputLabel>
                  <Select
                    label={tt("devices.form.whenSourceOff")}
                    value={dependencyWhenSourceOff}
                    onChange={(event) =>
                      setDependencyWhenSourceOff(
                        event.target.value as DeviceDependencyAction,
                      )
                    }
                  >
                    {DEPENDENCY_ACTION_OPTIONS.map((action) => (
                      <MenuItem key={action} value={action}>
                        {tt(`devices.form.dependencyActions.${action}`)}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>

              {selectedDependencyTargetUnavailable && (
                <Alert severity="warning">{tt("devices.form.dependencyConflict")}</Alert>
              )}
            </Stack>
          </Box>

          {autoAdvancedPreviewWarning && (
            <Alert severity="info">
              {tt("devices.form.autoPreviewWarning")}
            </Alert>
          )}
          <SchedulerRuleTreeBuilder
            title={tt("devices.form.autoLogicTitle")}
            description={tt("devices.form.autoLogicDescription")}
            enabled
            rule={autoRule}
            onGroupOperatorChange={handleAutoGroupOperatorChange}
            onAddCondition={handleAddAutoCondition}
            onAddGroup={handleAddAutoGroup}
            onRemoveNode={handleRemoveAutoRuleNode}
            onSourceChange={handleAutoConditionSourceChange}
            onComparatorChange={handleAutoConditionComparatorChange}
            onValueChange={handleAutoConditionValueChange}
            onUnitChange={handleAutoConditionUnitChange}
            powerUnits={autoPowerUnits}
            canUseBatterySoc={Boolean(provider?.has_energy_storage)}
            disabled={!canUseForm}
            showValidation={submitted}
            validation={{
              groupErrors: Object.fromEntries(
                Object.entries(autoRuleValidation.groupErrors).map(
                  ([groupId, code]) => [
                    groupId,
                    code === "empty"
                      ? tt("automation.validation.groupEmpty")
                      : undefined,
                  ],
                ),
              ),
              conditionErrors: Object.fromEntries(
                Object.entries(autoRuleValidation.conditionErrors).map(
                  ([conditionId, errors]) => [
                    conditionId,
                    {
                      value:
                        errors.value === "required"
                          ? tt("errors.validation.required")
                          : errors.value === "batteryRange"
                            ? tt("automation.validation.batteryRange")
                            : errors.value
                              ? tt("automation.validation.valueInvalid")
                              : undefined,
                      unit:
                        errors.unit === "required"
                          ? tt("automation.validation.unitRequired")
                          : errors.unit
                            ? tt("automation.validation.unitInvalid")
                            : undefined,
                    },
                  ],
                ),
              ),
            }}
          />
          <Box sx={{ minHeight: 20 }}>
            <Typography
              variant="caption"
              color="error"
              sx={{
                visibility: submitted && !autoRuleValid ? "visible" : "hidden",
              }}
            >
              {tt("devices.form.persistablePowerRequired")}
            </Typography>
          </Box>
          <Divider />
        </Stack>
      ) : (
        <Stack spacing={2}>
          <FormControl
            fullWidth
            size="small"
            sx={fieldSx}
            error={
              submitted &&
              isSchedule &&
              (
                schedulerId === "" ||
                Number.isNaN(Number(schedulerId)) ||
                selectedSchedulerCompatibility?.compatible === false
              )
            }
          >
            <InputLabel>{tt("devices.form.scheduler")}</InputLabel>
            <Select
              label={tt("devices.form.scheduler")}
              value={schedulerId}
              onChange={(event) => {
                const nextValue = String(event.target.value);
                setSchedulerId(nextValue === "" ? "" : Number(nextValue));
              }}
              disabled={schedulersLoading || schedulers.length === 0}
            >
              <MenuItem value="">
                <em>{tt("common.selectPlaceholder")}</em>
              </MenuItem>
              {schedulers.map((scheduler) => {
                const compatibility = schedulerCompatibility.get(scheduler.id);
                const incompatible =
                  compatibility != null && !compatibility.compatible;

                return (
                  <MenuItem
                    key={scheduler.id}
                    value={scheduler.id}
                    disabled={incompatible}
                  >
                    {incompatible
                      ? tt("devices.form.schedulerOptionRequiresTemperature", {
                          name: scheduler.name,
                        })
                      : scheduler.name}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          {schedulersLoadError && (
            <Alert severity="warning">{schedulersLoadError}</Alert>
          )}

          {selectedSchedulerCompatibility?.requiresTemperatureSensor && (
            <Alert
              severity={
                selectedSchedulerCompatibility.compatible ? "info" : "warning"
              }
            >
              {selectedSchedulerCompatibility.compatible
                ? tt("devices.form.schedulerTemperatureReady")
                : tt("devices.form.schedulerTemperatureMissing")}
            </Alert>
          )}
          {selectedSchedulerCompatibility?.requiresDeviceDependency &&
            !selectedSchedulerCompatibility.compatible && (
              <Alert severity="warning">
                {tt("devices.form.schedulerDependencyMissing")}
              </Alert>
            )}

          {schedulers.length === 0 && !schedulersLoading && (
            <Typography variant="caption" color="text.secondary">
              {tt("devices.form.noSchedulers")}
            </Typography>
          )}
          <Divider />
        </Stack>
      )}

      {onSubmit && hideActions && (
        <Box sx={{ minHeight: 20 }}>
          <Typography
            variant="caption"
            color="error"
            sx={{ visibility: submitError ? "visible" : "hidden" }}
          >
            {submitError || BLANK_HELPER}
          </Typography>
        </Box>
      )}

        {onSubmit && !hideActions && (
          <Stack spacing={1}>
            {submitError && <Alert severity="error">{submitError}</Alert>}
            <Box display="flex" justifyContent="flex-end" gap={1}>
              {onCancel && (
                <Button variant="outlined" onClick={onCancel} disabled={submitting}>
                  {tt("common.cancel")}
                </Button>
              )}
              <Button
                type="submit"
                variant="contained"
                disabled={submitting || isAtCapacity}
              >
                {submitting ? tt("common.loading") : tt("common.save")}
              </Button>
            </Box>
          </Stack>
        )}
      </Stack>
    </Box>
  );

  if (variant === "modal") {
    return content;
  }

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        bgcolor: "background.paper",
        borderColor: "divider",
      }}
    >
      <CardContent>{content}</CardContent>
    </Card>
  );
}
