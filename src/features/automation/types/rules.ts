export type AutomationRuleGroupOperator = "ALL" | "ANY";

export type AutomationRuleComparator = "gte" | "lte";

export type AutomationRuleSource =
  | "provider_primary_power"
  | "provider_battery_soc";

export type AutomationRuleConditionDraft = {
  id: string;
  source: AutomationRuleSource;
  comparator: AutomationRuleComparator;
  value: string;
  unit: string;
};

export type AutomationRuleGroupDraft = {
  id: string;
  operator: AutomationRuleGroupOperator;
  items: AutomationRuleNodeDraft[];
};

export type AutomationRuleNodeDraft =
  | AutomationRuleConditionDraft
  | AutomationRuleGroupDraft;

export type AutomationRuleConditionPayload = {
  source: AutomationRuleSource;
  comparator: AutomationRuleComparator;
  value: number;
  unit: string;
};

export type AutomationRuleGroupPayload = {
  operator: AutomationRuleGroupOperator;
  items?: AutomationRuleNodePayload[];
  conditions?: AutomationRuleConditionPayload[];
};

export type AutomationRuleNodePayload =
  | AutomationRuleConditionPayload
  | AutomationRuleGroupPayload;

export const BATTERY_SOC_UNIT = "%";

export const BATTERY_SOC_PRESET_VALUES = Array.from(
  { length: 21 },
  (_, index) => index * 5,
);

function createDraftId() {
  return `rule-${Math.random().toString(36).slice(2, 10)}`;
}

export function createAutomationConditionDraft(
  source: AutomationRuleSource,
  powerUnit: string,
): AutomationRuleConditionDraft {
  if (source === "provider_battery_soc") {
    return {
      id: createDraftId(),
      source,
      comparator: "gte",
      value: "30",
      unit: BATTERY_SOC_UNIT,
    };
  }

  return {
    id: createDraftId(),
    source,
    comparator: "gte",
    value: "",
    unit: powerUnit,
  };
}

export function createAutomationGroupDraft(
  operator: AutomationRuleGroupOperator = "ANY",
  items: AutomationRuleNodeDraft[] = [],
): AutomationRuleGroupDraft {
  return {
    id: createDraftId(),
    operator,
    items,
  };
}

export function isAutomationRuleGroupDraft(
  value: AutomationRuleNodeDraft,
): value is AutomationRuleGroupDraft {
  return "items" in value;
}

export function isAutomationRuleGroupPayload(
  value: AutomationRuleNodePayload,
): value is AutomationRuleGroupPayload {
  return "operator" in value && !("source" in value);
}

export function isBatteryRuleSource(source: AutomationRuleSource) {
  return source === "provider_battery_soc";
}

export function isPowerRuleSource(source: AutomationRuleSource) {
  return source === "provider_primary_power";
}
