import {
  Alert,
  Button,
  CircularProgress,
  FormControlLabel,
  Stack,
  Switch,
  TextField,
  Typography,
} from "@mui/material";

import type { ProviderMetadataForm } from "@/features/providers/types/provider";
import { useTranslation } from "react-i18next";

type ProviderFinalizationFormProps = {
  metadata: ProviderMetadataForm;
  errors: Record<string, string>;
  submitError: string | null;
  disabled?: boolean;
  loading?: boolean;
  submitLabel?: string;
  onChange: (field: keyof ProviderMetadataForm, value: string | boolean) => void;
  onSubmit: () => void;
};

export default function ProviderFinalizationForm({
  metadata,
  errors,
  submitError,
  disabled,
  loading,
  submitLabel,
  onChange,
  onSubmit,
}: ProviderFinalizationFormProps) {
  const { t } = useTranslation();

  return (
    <Stack spacing={2}>
      <Typography variant="h6">{t("providers.finalizationTitle")}</Typography>
      {submitError && <Alert severity="error">{submitError}</Alert>}
      <TextField
        label={t("providers.fields.name")}
        value={metadata.name}
        onChange={(event) => onChange("name", event.target.value)}
        error={!!errors.name}
        helperText={errors.name}
        fullWidth
        disabled={disabled}
      />
      <TextField
        label={t("providers.fields.minValue")}
        type="number"
        value={metadata.value_min}
        onChange={(event) => onChange("value_min", event.target.value)}
        error={!!errors.value_min}
        helperText={errors.value_min}
        fullWidth
        disabled={disabled}
      />
      <TextField
        label={t("providers.fields.maxValue")}
        type="number"
        value={metadata.value_max}
        onChange={(event) => onChange("value_max", event.target.value)}
        error={!!errors.value_max}
        helperText={errors.value_max}
        fullWidth
        disabled={disabled}
      />
      <FormControlLabel
        control={
          <Switch
            checked={metadata.enabled}
            onChange={(event) => onChange("enabled", event.target.checked)}
            disabled={disabled}
          />
        }
        label={t("providers.fields.enabled")}
      />
      <Button variant="contained" onClick={onSubmit} disabled={disabled || loading}>
        {loading ? (
          <CircularProgress size={20} />
        ) : (
          submitLabel ?? t("providers.actions.create")
        )}
      </Button>
    </Stack>
  );
}
