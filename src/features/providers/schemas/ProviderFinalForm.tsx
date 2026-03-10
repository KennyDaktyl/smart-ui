import BatteryChargingFullIcon from "@mui/icons-material/BatteryChargingFull";
import ElectricMeterIcon from "@mui/icons-material/ElectricMeter";
import SolarPowerIcon from "@mui/icons-material/SolarPower";
import {
  Box,
  TextField,
  Button,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  FormGroup,
} from "@mui/material";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import IconLabel from "@/components/atoms/IconLabel";

type Props = {
  defaultUnit: string;
  defaultPowerSource?: "inverter" | "meter";
  defaultHasPowerMeter?: boolean;
  defaultHasEnergyStorage?: boolean;
  onSubmit: (data: {
    name: string;
    value_min: number;
    value_max: number;
    power_source: "inverter" | "meter";
    has_power_meter: boolean;
    has_energy_storage: boolean;
  }) => void;
  loading?: boolean;
  errors?: Record<string, string>;
  formId?: string;
  hideSubmitButton?: boolean;
};

export default function ProviderFinalForm({
  defaultUnit,
  defaultPowerSource = "meter",
  defaultHasPowerMeter = false,
  defaultHasEnergyStorage = false,
  onSubmit,
  loading = false,
  errors = {},
  formId,
  hideSubmitButton = false,
}: Props) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [valueMin, setValueMin] = useState(0);
  const [valueMax, setValueMax] = useState(20);
  const [powerSource, setPowerSource] = useState<"inverter" | "meter">(
    defaultPowerSource
  );
  const [hasPowerMeter, setHasPowerMeter] = useState(defaultHasPowerMeter);
  const [hasEnergyStorage, setHasEnergyStorage] = useState(
    defaultHasEnergyStorage
  );
  const isNameError = Boolean(errors.name);
  const isMinError = Boolean(errors.value_min);
  const isMaxError = Boolean(errors.value_max);
  const isPowerSourceError = Boolean(errors.power_source);
  const isPowerMeterError = Boolean(errors.has_power_meter);
  const isEnergyStorageError = Boolean(errors.has_energy_storage);
  const powerSourceLabel = t("providers.wizard.finalForm.powerSource");

  const nameHelper = isNameError
    ? t("providers.validation.backendError", {
        message: errors.name,
      })
    : undefined;

  const minHelper = isMinError
    ? t("providers.validation.backendError", {
        message: errors.value_min,
      })
    : undefined;

  const maxHelper = isMaxError
    ? t("providers.validation.backendError", {
        message: errors.value_max,
      })
    : valueMin >= valueMax
    ? t("providers.validation.range")
    : undefined;
  const powerSourceHelper = isPowerSourceError
    ? t("providers.validation.backendError", {
        message: errors.power_source,
      })
    : undefined;
  const powerMeterHelper = isPowerMeterError
    ? t("providers.validation.backendError", {
        message: errors.has_power_meter,
      })
    : undefined;
  const energyStorageHelper = isEnergyStorageError
    ? t("providers.validation.backendError", {
        message: errors.has_energy_storage,
      })
    : undefined;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    if (valueMin >= valueMax) return;
    onSubmit({
      name,
      value_min: valueMin,
      value_max: valueMax,
      power_source: powerSource,
      has_power_meter: hasPowerMeter,
      has_energy_storage: hasEnergyStorage,
    });
  };

  return (
    <Box component="form" id={formId} onSubmit={handleSubmit} display="flex" flexDirection="column" gap={2}>
      <TextField
        label={t("providers.wizard.finalForm.name")}
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        error={isNameError}
        helperText={nameHelper}
        disabled={loading}
      />

      <TextField
        type="number"
        label={t("providers.wizard.finalForm.minValue", {
          unit: defaultUnit,
        })}
        value={valueMin}
        onChange={(event) => setValueMin(Number(event.target.value))}
        error={isMinError}
        helperText={minHelper}
        disabled={loading}
      />

      <TextField
        type="number"
        label={t("providers.wizard.finalForm.maxValue", {
          unit: defaultUnit,
        })}
        value={valueMax}
        onChange={(event) => setValueMax(Number(event.target.value))}
        error={isMaxError}
        helperText={maxHelper}
        disabled={loading}
      />

      <FormControl fullWidth error={isPowerSourceError}>
        <InputLabel id="provider-power-source-label">
          <IconLabel icon={<SolarPowerIcon fontSize="small" />}>
            {powerSourceLabel}
          </IconLabel>
        </InputLabel>
        <Select
          labelId="provider-power-source-label"
          label={powerSourceLabel}
          value={powerSource}
          onChange={(e) =>
            setPowerSource(e.target.value as "inverter" | "meter")
          }
          disabled={loading}
          renderValue={(selected) => (
            <IconLabel
              icon={
                selected === "meter" ? (
                  <ElectricMeterIcon fontSize="small" />
                ) : (
                  <SolarPowerIcon fontSize="small" />
                )
              }
            >
              {selected === "meter"
                ? t("providers.powerSource.meter")
                : t("providers.powerSource.inverter")}
            </IconLabel>
          )}
        >
          <MenuItem value="inverter">
            <IconLabel icon={<SolarPowerIcon fontSize="small" />}>
              {t("providers.powerSource.inverter")}
            </IconLabel>
          </MenuItem>
          <MenuItem value="meter">
            <IconLabel icon={<ElectricMeterIcon fontSize="small" />}>
              {t("providers.powerSource.meter")}
            </IconLabel>
          </MenuItem>
        </Select>
        {powerSourceHelper && (
          <FormHelperText>{powerSourceHelper}</FormHelperText>
        )}
      </FormControl>

      <FormControl
        error={isPowerMeterError || isEnergyStorageError}
        component="fieldset"
        variant="standard"
      >
        <FormGroup>
          <FormControlLabel
            control={
              <Checkbox
                checked={hasPowerMeter}
                onChange={(event) => setHasPowerMeter(event.target.checked)}
                disabled={loading}
              />
            }
            label={
              <IconLabel icon={<ElectricMeterIcon fontSize="small" />}>
                {t("providers.wizard.finalForm.hasPowerMeter")}
              </IconLabel>
            }
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={hasEnergyStorage}
                onChange={(event) => setHasEnergyStorage(event.target.checked)}
                disabled={loading}
              />
            }
            label={
              <IconLabel icon={<BatteryChargingFullIcon fontSize="small" />}>
                {t("providers.wizard.finalForm.hasEnergyStorage")}
              </IconLabel>
            }
          />
        </FormGroup>
        {powerMeterHelper ? (
          <FormHelperText>{powerMeterHelper}</FormHelperText>
        ) : null}
        {energyStorageHelper ? (
          <FormHelperText>{energyStorageHelper}</FormHelperText>
        ) : null}
      </FormControl>

      {!hideSubmitButton && (
        <Button
          type="submit"
          variant="contained"
          disabled={loading || !name.trim() || valueMin >= valueMax}
        >
          {t("providers.actions.create")}
        </Button>
      )}
    </Box>
  );
}
