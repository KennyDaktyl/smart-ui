import AddIcon from "@mui/icons-material/Add";
import BatteryChargingFullIcon from "@mui/icons-material/BatteryChargingFull";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import SolarPowerIcon from "@mui/icons-material/SolarPower";
import {
  Box,
  Button,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";

import IconLabel from "@/components/atoms/IconLabel";
import type {
  AutomationRuleComparator,
  AutomationRuleConditionDraft,
  AutomationRuleGroupOperator,
  AutomationRuleSource,
} from "@/features/automation/types/rules";
import {
  BATTERY_SOC_PRESET_VALUES,
  isBatteryRuleSource,
} from "@/features/automation/types/rules";

type Props = {
  title: string;
  description?: string;
  enabled: boolean;
  onEnabledChange?: (enabled: boolean) => void;
  operator: AutomationRuleGroupOperator;
  onOperatorChange: (operator: AutomationRuleGroupOperator) => void;
  conditions: AutomationRuleConditionDraft[];
  onAddCondition: () => void;
  onRemoveCondition: (conditionId: string) => void;
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
  hideToggle?: boolean;
  toggleLabel?: string;
  disabledHint?: string;
};

export function AutomationRuleBuilder({
  title,
  description,
  enabled,
  onEnabledChange,
  operator,
  onOperatorChange,
  conditions,
  onAddCondition,
  onRemoveCondition,
  onSourceChange,
  onComparatorChange,
  onValueChange,
  onUnitChange,
  powerUnits,
  canUseBatterySoc,
  disabled = false,
  hideToggle = false,
  toggleLabel,
  disabledHint,
}: Props) {
  const { t } = useTranslation();

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
        {!hideToggle && onEnabledChange ? (
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
          {disabledHint ?? t("automation.disabledHint")}
        </Typography>
      ) : (
        <Stack spacing={1.25}>
          <FormControl fullWidth size="small" disabled={disabled}>
            <InputLabel>{t("automation.matchMode")}</InputLabel>
            <Select
              label={t("automation.matchMode")}
              value={operator}
              onChange={(event) =>
                onOperatorChange(event.target.value as AutomationRuleGroupOperator)
              }
            >
              <MenuItem value="ALL">{t("automation.matchAll")}</MenuItem>
              <MenuItem value="ANY">{t("automation.matchAny")}</MenuItem>
            </Select>
          </FormControl>

          <Stack spacing={1}>
            {conditions.map((condition) => {
              const isBattery = isBatteryRuleSource(condition.source);
              const presetValue = BATTERY_SOC_PRESET_VALUES.includes(
                Number(condition.value),
              )
                ? condition.value
                : "";

              return (
                <Box
                  key={condition.id}
                  sx={{
                    p: 1.25,
                    borderRadius: 2,
                    border: "1px dashed",
                    borderColor: "divider",
                    bgcolor: "#fafafa",
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
                              <IconLabel icon={option.icon}>
                                {option.label}
                              </IconLabel>
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
                          onChange={(event) =>
                            onValueChange(condition.id, event.target.value)
                          }
                          inputProps={{ min: 0, step: 0.1 }}
                        />
                      )}

                      {isBattery ? null : (
                        <FormControl fullWidth size="small" disabled={disabled}>
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
                        </FormControl>
                      )}

                      <IconButton
                        color="error"
                        disabled={disabled}
                        onClick={() => onRemoveCondition(condition.id)}
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
                        onChange={(event) =>
                          onValueChange(condition.id, event.target.value)
                        }
                        inputProps={{ min: 0, max: 100, step: 1 }}
                        helperText={t("automation.customBatteryHint")}
                      />
                    ) : null}
                  </Stack>
                </Box>
              );
            })}
          </Stack>

          <Box>
            <Button
              size="small"
              startIcon={<AddIcon fontSize="small" />}
              disabled={disabled}
              onClick={onAddCondition}
            >
              {t("automation.addCondition")}
            </Button>
          </Box>
        </Stack>
      )}
    </Stack>
  );
}
