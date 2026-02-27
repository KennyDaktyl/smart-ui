import { Box, TextField, Button } from "@mui/material";
import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

type Props = {
  defaultUnit: string;
  onSubmit: (data: {
    name: string;
    value_min: number;
    value_max: number;
  }) => void;
  loading?: boolean;
  errors?: Record<string, string>;
  formId?: string;
  hideSubmitButton?: boolean;
};

export default function ProviderFinalForm({
  defaultUnit,
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
  const isNameError = Boolean(errors.name);
  const isMinError = Boolean(errors.value_min);
  const isMaxError = Boolean(errors.value_max);

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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name,
      value_min: valueMin,
      value_max: valueMax,
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
