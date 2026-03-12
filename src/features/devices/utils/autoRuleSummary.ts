import {
  type AutomationRuleConditionPayload,
  type AutomationRuleGroupPayload,
  isAutomationRuleGroupPayload,
} from "@/features/automation/types/rules";
import type { Device } from "@/features/devices/types/devicesType";

type TranslateFn = (key: string, options?: Record<string, unknown>) => unknown;

type DeviceAutoRuleSource = Pick<
  Device,
  "auto_rule" | "auto_rule_json" | "threshold_value"
>;

function isAutomationRuleConditionPayload(
  value: AutomationRuleConditionPayload | AutomationRuleGroupPayload,
): value is AutomationRuleConditionPayload {
  return "source" in value;
}

function formatRuleValue(value: number, unit: string) {
  const formatted = Number.isInteger(value) ? String(value) : String(value);
  if (unit === "%") {
    return `${formatted}%`;
  }
  return `${formatted} ${unit}`.trim();
}

function formatCondition(
  condition: AutomationRuleConditionPayload,
  t: TranslateFn,
) {
  const sourceLabel = t(`automation.sources.${condition.source}`);
  const comparatorLabel = condition.comparator === "lte" ? "<=" : ">=";
  return `${String(sourceLabel)} ${comparatorLabel} ${formatRuleValue(condition.value, condition.unit)}`;
}

function formatGroup(
  group: AutomationRuleGroupPayload,
  t: TranslateFn,
  nested = false,
): string {
  const items = group.items ?? group.conditions ?? [];
  const joiner = group.operator === "ALL" ? " AND " : " OR ";
  const summary = items
    .map((item) => {
      if (isAutomationRuleGroupPayload(item)) {
        return formatGroup(item, t, true);
      }
      if (isAutomationRuleConditionPayload(item)) {
        return formatCondition(item, t);
      }
      return "";
    })
    .filter(Boolean)
    .join(joiner);

  if (!summary) {
    return "";
  }

  return nested ? `(${summary})` : summary;
}

export function getDeviceAutoRulePayload(
  device: DeviceAutoRuleSource,
  powerUnit?: string | null,
): AutomationRuleGroupPayload | null {
  if (device.auto_rule) {
    return device.auto_rule;
  }
  if (device.auto_rule_json) {
    return device.auto_rule_json;
  }
  if (device.threshold_value == null) {
    return null;
  }

  return {
    operator: "ANY",
    items: [
      {
        source: "provider_primary_power",
        comparator: "gte",
        value: device.threshold_value,
        unit: powerUnit ?? "W",
      },
    ],
  };
}

export function formatDeviceAutoRuleSummary(
  device: DeviceAutoRuleSource,
  t: TranslateFn,
  powerUnit?: string | null,
) {
  const rule = getDeviceAutoRulePayload(device, powerUnit);
  if (!rule) {
    return null;
  }

  return formatGroup(rule, t);
}
