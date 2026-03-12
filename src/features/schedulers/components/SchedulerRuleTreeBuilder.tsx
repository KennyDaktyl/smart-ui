import AddIcon from "@mui/icons-material/Add";
import BatteryChargingFullIcon from "@mui/icons-material/BatteryChargingFull";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import HubIcon from "@mui/icons-material/Hub";
import SolarPowerIcon from "@mui/icons-material/SolarPower";
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import { useMemo, type ReactNode } from "react";
import { useTranslation } from "react-i18next";

import IconLabel from "@/components/atoms/IconLabel";
import type {
  AutomationRuleComparator,
  AutomationRuleConditionDraft,
  AutomationRuleGroupDraft,
  AutomationRuleGroupOperator,
  AutomationRuleSource,
  AutomationRuleNodeDraft,
} from "@/features/automation/types/rules";
import {
  BATTERY_SOC_PRESET_VALUES,
  isAutomationRuleGroupDraft,
  isBatteryRuleSource,
} from "@/features/automation/types/rules";

type Props = {
  title: string;
  description?: string;
  enabled: boolean;
  onEnabledChange?: (enabled: boolean) => void;
  rule: AutomationRuleGroupDraft;
  onGroupOperatorChange: (
    groupId: string,
    operator: AutomationRuleGroupOperator,
  ) => void;
  onAddCondition: (groupId: string) => void;
  onAddGroup: (groupId: string) => void;
  onRemoveNode: (nodeId: string) => void;
  onSourceChange: (
    conditionId: string,
    source: AutomationRuleSource,
  ) => void;
  onComparatorChange: (
    conditionId: string,
    comparator: AutomationRuleComparator,
  ) => void;
  onValueChange: (conditionId: string, value: string) => void;
  onUnitChange: (conditionId: string, unit: string) => void;
  powerUnits: string[];
  canUseBatterySoc: boolean;
  disabled?: boolean;
  toggleLabel?: string;
  showValidation?: boolean;
  validation?: {
    groupErrors: Record<string, string | undefined>;
    conditionErrors: Record<
      string,
      {
        value?: string;
        unit?: string;
      }
    >;
  };
};

type RuleGroupProps = {
  group: AutomationRuleGroupDraft;
  depth: number;
  isRoot?: boolean;
  groupNumbers: Map<string, number>;
} & Pick<
  Props,
  | "disabled"
  | "powerUnits"
  | "canUseBatterySoc"
  | "onAddCondition"
  | "onAddGroup"
  | "onComparatorChange"
  | "onGroupOperatorChange"
  | "onRemoveNode"
  | "onSourceChange"
  | "onUnitChange"
  | "onValueChange"
  | "showValidation"
  | "validation"
>;

const BLANK_HELPER = " ";

function buildGroupNumbers(rule: AutomationRuleGroupDraft): Map<string, number> {
  const numbers = new Map<string, number>();
  let index = 1;

  const visit = (group: AutomationRuleGroupDraft, isRoot = false) => {
    if (!isRoot) {
      numbers.set(group.id, index);
      index += 1;
    }

    group.items.forEach((item) => {
      if (isAutomationRuleGroupDraft(item)) {
        visit(item);
      }
    });
  };

  visit(rule, true);
  return numbers;
}

function ConditionRow({
  condition,
  disabled,
  powerUnits,
  canUseBatterySoc,
  onRemoveNode,
  onSourceChange,
  onComparatorChange,
  onValueChange,
  onUnitChange,
  validation,
  showValidation = false,
}: {
  condition: AutomationRuleConditionDraft;
} & Pick<
  Props,
  | "disabled"
  | "powerUnits"
  | "canUseBatterySoc"
  | "onRemoveNode"
  | "onSourceChange"
  | "onComparatorChange"
  | "onValueChange"
  | "onUnitChange"
  | "validation"
  | "showValidation"
>) {
  const { t } = useTranslation();
  const isBattery = isBatteryRuleSource(condition.source);
  const presetValue = BATTERY_SOC_PRESET_VALUES.includes(Number(condition.value))
    ? condition.value
    : "";
  const fieldErrors = showValidation
    ? validation?.conditionErrors[condition.id]
    : undefined;
  const valueError = fieldErrors?.value;
  const unitError = fieldErrors?.unit;
  const hasError = Boolean(valueError || unitError);

  const sourceOptions: Array<{
    value: AutomationRuleSource;
    label: string;
    icon: ReactNode;
  }> = [
    {
      value: "provider_primary_power",
      label: t("automation.sources.provider_primary_power"),
      icon: <SolarPowerIcon fontSize="small" />,
    },
  ];

  if (canUseBatterySoc) {
    sourceOptions.push({
      value: "provider_battery_soc",
      label: t("automation.sources.provider_battery_soc"),
      icon: <BatteryChargingFullIcon fontSize="small" />,
    });
  }

  return (
    <Box
      sx={{
        p: 1.25,
        borderRadius: 2,
        border: "1px solid",
        borderColor: hasError ? "error.main" : "rgba(148, 163, 184, 0.28)",
        bgcolor: hasError ? "rgba(254, 242, 242, 0.7)" : "#ffffff",
      }}
    >
      <Stack spacing={1}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: isBattery ? "1.2fr 0.8fr 1fr auto" : "1.2fr 0.8fr 1fr 0.8fr auto",
            },
            gap: 1,
            alignItems: "center",
          }}
        >
          <FormControl fullWidth size="small" disabled={disabled}>
            <InputLabel>{t("automation.conditionSource")}</InputLabel>
            <Select
              label={t("automation.conditionSource")}
              value={condition.source}
              renderValue={(selected) => {
                const selectedOption = sourceOptions.find(
                  (option) => option.value === selected,
                );
                if (!selectedOption) {
                  return String(selected);
                }

                return (
                  <IconLabel icon={selectedOption.icon}>
                    {selectedOption.label}
                  </IconLabel>
                );
              }}
              onChange={(event) =>
                onSourceChange(
                  condition.id,
                  event.target.value as AutomationRuleSource,
                )
              }
            >
              {sourceOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  <IconLabel icon={option.icon}>{option.label}</IconLabel>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small" disabled={disabled}>
            <InputLabel>{t("automation.comparator")}</InputLabel>
            <Select
              label={t("automation.comparator")}
              value={condition.comparator}
              onChange={(event) =>
                onComparatorChange(
                  condition.id,
                  event.target.value as AutomationRuleComparator,
                )
              }
            >
              <MenuItem value="gte">{t("automation.comparators.gte")}</MenuItem>
              <MenuItem value="lte">{t("automation.comparators.lte")}</MenuItem>
            </Select>
          </FormControl>

          {isBattery ? (
            <TextField
              select
              fullWidth
              size="small"
              label={t("automation.valuePreset")}
              value={presetValue}
              disabled={disabled}
              onChange={(event) =>
                onValueChange(condition.id, event.target.value)
              }
              helperText={t("automation.batteryPresetHint")}
            >
              {BATTERY_SOC_PRESET_VALUES.map((value) => (
                <MenuItem key={value} value={String(value)}>
                  {value}%
                </MenuItem>
              ))}
            </TextField>
          ) : (
            <TextField
              fullWidth
              size="small"
              type="number"
              label={t("automation.conditionValue")}
              value={condition.value}
              disabled={disabled}
              error={Boolean(valueError)}
              onChange={(event) =>
                onValueChange(condition.id, event.target.value)
              }
              inputProps={{ min: 0, step: 0.1 }}
              helperText={valueError ?? BLANK_HELPER}
            />
          )}

          {isBattery ? null : (
            <FormControl
              fullWidth
              size="small"
              disabled={disabled}
              error={Boolean(unitError)}
            >
              <InputLabel>{t("automation.unit")}</InputLabel>
              <Select
                label={t("automation.unit")}
                value={condition.unit}
                onChange={(event) =>
                  onUnitChange(condition.id, event.target.value)
                }
              >
                {powerUnits.map((unit) => (
                  <MenuItem key={unit} value={unit}>
                    {unit}
                  </MenuItem>
                ))}
              </Select>
              <FormHelperText>{unitError ?? BLANK_HELPER}</FormHelperText>
            </FormControl>
          )}

          <IconButton
            color="error"
            disabled={disabled}
            onClick={() => onRemoveNode(condition.id)}
          >
            <DeleteOutlineIcon fontSize="small" />
          </IconButton>
        </Box>

        {isBattery ? (
          <TextField
            fullWidth
            size="small"
            type="number"
            label={t("automation.customBatteryValue")}
            value={condition.value}
            disabled={disabled}
            error={Boolean(valueError)}
            onChange={(event) => onValueChange(condition.id, event.target.value)}
            inputProps={{ min: 0, max: 100, step: 1 }}
            helperText={valueError ?? t("automation.customBatteryHint")}
          />
        ) : null}
      </Stack>
    </Box>
  );
}

function RuleGroup({
  group,
  depth,
  isRoot = false,
  disabled = false,
  powerUnits,
  canUseBatterySoc,
  onAddCondition,
  onAddGroup,
  onComparatorChange,
  onGroupOperatorChange,
  onRemoveNode,
  onSourceChange,
  onUnitChange,
  onValueChange,
  showValidation = false,
  validation,
  groupNumbers,
}: RuleGroupProps) {
  const { t } = useTranslation();
  const groupError = showValidation ? validation?.groupErrors[group.id] : undefined;
  const groupNumber = groupNumbers.get(group.id);
  const canAddNestedGroup = isRoot;

  return (
    <Box
      sx={{
        ml: isRoot ? 0 : { xs: 1, sm: 1.5 },
        p: { xs: 1, sm: 1.25 },
        borderRadius: 2.5,
        border: "1px solid",
        borderColor: groupError
          ? "error.main"
          : depth === 0
            ? "rgba(148, 163, 184, 0.32)"
            : "rgba(148, 163, 184, 0.22)",
        bgcolor: groupError
          ? "rgba(254, 242, 242, 0.72)"
          : depth === 0
            ? "rgba(241, 245, 249, 0.76)"
            : "rgba(236, 253, 245, 0.7)",
      }}
    >
      <Stack spacing={1.25}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
        >
          <Stack direction="row" spacing={1} alignItems="center">
            {!isRoot && <HubIcon fontSize="small" color="action" />}
            <Typography variant="body2" fontWeight={700}>
              {isRoot
                ? t("automation.rootGroup")
                : t("automation.groupLabel", { index: groupNumber ?? depth + 1 })}
            </Typography>
          </Stack>

          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1}
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <FormControl size="small" disabled={disabled} sx={{ minWidth: 180 }}>
              <InputLabel>{t("automation.matchMode")}</InputLabel>
              <Select
                label={t("automation.matchMode")}
                value={group.operator}
                onChange={(event) =>
                  onGroupOperatorChange(
                    group.id,
                    event.target.value as AutomationRuleGroupOperator,
                  )
                }
              >
                <MenuItem value="ALL">{t("automation.matchAll")}</MenuItem>
                <MenuItem value="ANY">{t("automation.matchAny")}</MenuItem>
              </Select>
            </FormControl>

            <Button
              size="small"
              startIcon={<AddIcon fontSize="small" />}
              disabled={disabled}
              onClick={() => onAddCondition(group.id)}
              sx={{ width: { xs: "100%", md: "auto" } }}
            >
              {t("automation.addCondition")}
            </Button>

            {canAddNestedGroup ? (
              <Button
                size="small"
                startIcon={<HubIcon fontSize="small" />}
                disabled={disabled}
                onClick={() => onAddGroup(group.id)}
                sx={{ width: { xs: "100%", md: "auto" } }}
              >
                {t("automation.addGroup")}
              </Button>
            ) : null}

            {!isRoot && (
              <IconButton
                color="error"
                disabled={disabled}
                onClick={() => onRemoveNode(group.id)}
              >
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            )}
          </Stack>
        </Stack>

        {groupError ? (
          <Typography variant="caption" color="error.main">
            {groupError}
          </Typography>
        ) : null}

        {group.items.length === 0 ? (
          <Typography
            variant="caption"
            color={groupError ? "error.main" : "text.secondary"}
          >
            {groupError ?? t("automation.emptyGroup")}
          </Typography>
        ) : (
          <Stack spacing={1}>
            {group.items.map((item: AutomationRuleNodeDraft) =>
              isAutomationRuleGroupDraft(item) ? (
                <RuleGroup
                  key={item.id}
                  group={item}
                  depth={depth + 1}
                  groupNumbers={groupNumbers}
                  disabled={disabled}
                  powerUnits={powerUnits}
                  canUseBatterySoc={canUseBatterySoc}
                  onAddCondition={onAddCondition}
                  onAddGroup={onAddGroup}
                  onComparatorChange={onComparatorChange}
                  onGroupOperatorChange={onGroupOperatorChange}
                  onRemoveNode={onRemoveNode}
                  onSourceChange={onSourceChange}
                  onUnitChange={onUnitChange}
                  onValueChange={onValueChange}
                  showValidation={showValidation}
                  validation={validation}
                />
              ) : (
                <ConditionRow
                  key={item.id}
                  condition={item}
                  disabled={disabled}
                  powerUnits={powerUnits}
                  canUseBatterySoc={canUseBatterySoc}
                  onRemoveNode={onRemoveNode}
                  onSourceChange={onSourceChange}
                  onComparatorChange={onComparatorChange}
                  onValueChange={onValueChange}
                  onUnitChange={onUnitChange}
                  showValidation={showValidation}
                  validation={validation}
                />
              ),
            )}
          </Stack>
        )}
      </Stack>
    </Box>
  );
}

export function SchedulerRuleTreeBuilder({
  title,
  description,
  enabled,
  onEnabledChange,
  rule,
  onGroupOperatorChange,
  onAddCondition,
  onAddGroup,
  onRemoveNode,
  onSourceChange,
  onComparatorChange,
  onValueChange,
  onUnitChange,
  powerUnits,
  canUseBatterySoc,
  disabled = false,
  toggleLabel,
  showValidation = false,
  validation,
}: Props) {
  const { t } = useTranslation();
  const groupNumbers = useMemo(() => buildGroupNumbers(rule), [rule]);

  return (
    <Stack spacing={1.5}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "flex-start", sm: "center" }}
        spacing={1}
      >
        <Box>
          <Typography variant="subtitle2" fontWeight={700}>
            {title}
          </Typography>
          {description ? (
            <Typography variant="caption" color="text.secondary">
              {description}
            </Typography>
          ) : null}
        </Box>
        {onEnabledChange ? (
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption" color="text.secondary">
              {toggleLabel ?? t("automation.enable")}
            </Typography>
            <Switch
              checked={enabled}
              disabled={disabled}
              onChange={(_, checked) => onEnabledChange(checked)}
            />
          </Stack>
        ) : null}
      </Stack>

      {!enabled ? (
        <Typography variant="caption" color="text.secondary">
          {t("automation.disabledHint")}
        </Typography>
      ) : (
        <RuleGroup
          group={rule}
          depth={0}
          isRoot
          groupNumbers={groupNumbers}
          disabled={disabled}
          powerUnits={powerUnits}
          canUseBatterySoc={canUseBatterySoc}
          onAddCondition={onAddCondition}
          onAddGroup={onAddGroup}
          onComparatorChange={onComparatorChange}
          onGroupOperatorChange={onGroupOperatorChange}
          onRemoveNode={onRemoveNode}
          onSourceChange={onSourceChange}
          onUnitChange={onUnitChange}
          onValueChange={onValueChange}
          showValidation={showValidation}
          validation={validation}
        />
      )}
    </Stack>
  );
}
