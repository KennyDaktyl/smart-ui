import {
  Box,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
} from "@mui/material";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  defaultUnit: string;
  defaultPowerSource?: "inverter" | "meter";
  onSubmit: (data: {
    name: string;
    value_min: number;
    value_max: number;
    power_source: "inverter" | "meter";
  }) => void;
  loading?: boolean;
  errors?: Record<string, string>;
  formId?: string;
  hideSubmitButton?: boolean;
};

export default function ProviderFinalForm({
  defaultUnit,
  defaultPowerSource = "meter",
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
  const isNameError = Boolean(errors.name);
  const isMinError = Boolean(errors.value_min);
  const isMaxError = Boolean(errors.value_max);
  const isPowerSourceError = Boolean(errors.power_source);

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
    : undefined;
  const powerSourceHelper = isPowerSourceError
    ? t("providers.validation.backendError", {
        message: errors.power_source,
      })
    : undefined;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name,
      value_min: valueMin,
      value_max: valueMax,
      power_source: powerSource,
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
      />

      <FormControl fullWidth error={isPowerSourceError}>
        <InputLabel id="provider-power-source-label">
          {t("providers.wizard.finalForm.powerSource")}
        </InputLabel>
        <Select
          labelId="provider-power-source-label"
          label={t("providers.wizard.finalForm.powerSource")}
          value={powerSource}
          onChange={(e) =>
            setPowerSource(e.target.value as "inverter" | "meter")
          }
          disabled={loading}
        >
          <MenuItem value="inverter">
            {t("providers.powerSource.inverter")}
          </MenuItem>
          <MenuItem value="meter">{t("providers.powerSource.meter")}</MenuItem>
        </Select>
        {powerSourceHelper && (
          <FormHelperText>{powerSourceHelper}</FormHelperText>
        )}
      </FormControl>

      {!hideSubmitButton && (
        <Button
          type="submit"
          variant="contained"
          disabled={loading || !name.trim()}
        >
          {t("providers.actions.create")}
        </Button>
      )}
    </Box>
  );
}
