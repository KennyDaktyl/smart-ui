import {
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";

import { providersApi } from "@/api/providersApi";
import { parseApiError } from "@/api/parseApiError";
import { StickyDialog } from "@/components/dialogs/StickyDialog";
import { useToast } from "@/context/ToastContext";
import type { ProviderResponse } from "@/features/providers/types/userProvider";

type Props = {
  open: boolean;
  provider: ProviderResponse | null;
  onClose: (updated?: ProviderResponse) => void;
};

const FORM_ID = "provider-edit-form";

export default function EditProviderDialog({ open, provider, onClose }: Props) {
  const { t } = useTranslation();
  const { notifyError, notifySuccess } = useToast();

  const [name, setName] = useState("");
  const [valueMin, setValueMin] = useState<number>(0);
  const [valueMax, setValueMax] = useState<number>(0);
  const [powerSource, setPowerSource] = useState<"inverter" | "meter">("meter");
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!provider) {
      setName("");
      setValueMin(0);
      setValueMax(0);
      setPowerSource("meter");
      setFormError(null);
      setFieldErrors({});
      return;
    }

    setName(provider.name ?? "");
    setValueMin(provider.value_min ?? 0);
    setValueMax(provider.value_max ?? 0);
    setPowerSource(provider.power_source === "inverter" ? "inverter" : "meter");
    setFormError(null);
    setFieldErrors({});
  }, [provider]);

  const isSaveDisabled = useMemo(() => {
    if (!provider) return true;
    if (!name.trim()) return true;
    if (valueMin >= valueMax) return true;
    return loading;
  }, [loading, name, provider, valueMax, valueMin]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!provider) return;

    setLoading(true);
    setFormError(null);
    setFieldErrors({});

    try {
      const { data } = await providersApi.updateProvider(provider.uuid, {
        name: name.trim(),
        value_min: valueMin,
        value_max: valueMax,
        power_source: powerSource,
      });

      notifySuccess(t("providers.success.update"));
      onClose(data);
    } catch (error) {
      const parsed = parseApiError(error);
      setFormError(
        t("providers.errors.updateDetail", { message: parsed.message })
      );
      setFieldErrors(parsed.fieldErrors ?? {});
      notifyError(t("providers.errors.updateDetail", { message: parsed.message }));
    } finally {
      setLoading(false);
    }
  };

  return (
    <StickyDialog
      open={open}
      onClose={() => onClose()}
      maxWidth="sm"
      title={t("providers.actions.edit")}
      actions={
        <>
          <Button onClick={() => onClose()}>{t("common.cancel")}</Button>
          <Button type="submit" form={FORM_ID} variant="contained" disabled={isSaveDisabled}>
            {t("common.save")}
          </Button>
        </>
      }
    >
      {formError && (
        <Typography color="error" sx={{ mb: 2 }}>
          {formError}
        </Typography>
      )}

      <Stack component="form" id={FORM_ID} onSubmit={handleSubmit} spacing={2}>
        <TextField
          label={t("providers.wizard.finalForm.name")}
          value={name}
          onChange={(event) => setName(event.target.value)}
          required
          error={Boolean(fieldErrors.name)}
          helperText={
            fieldErrors.name
              ? t("providers.validation.backendError", {
                  message: fieldErrors.name,
                })
              : undefined
          }
          disabled={loading}
        />

        <FormControl fullWidth error={Boolean(fieldErrors.power_source)}>
          <InputLabel id="provider-edit-power-source-label">
            {t("providers.wizard.finalForm.powerSource")}
          </InputLabel>
          <Select
            labelId="provider-edit-power-source-label"
            label={t("providers.wizard.finalForm.powerSource")}
            value={powerSource}
            onChange={(event) =>
              setPowerSource(event.target.value as "inverter" | "meter")
            }
            disabled={loading}
          >
            <MenuItem value="inverter">{t("providers.powerSource.inverter")}</MenuItem>
            <MenuItem value="meter">{t("providers.powerSource.meter")}</MenuItem>
          </Select>
          {fieldErrors.power_source && (
            <FormHelperText>
              {t("providers.validation.backendError", {
                message: fieldErrors.power_source,
              })}
            </FormHelperText>
          )}
        </FormControl>

        <TextField
          type="number"
          label={t("providers.wizard.finalForm.minValue", {
            unit: provider?.unit ?? "",
          })}
          value={valueMin}
          onChange={(event) => setValueMin(Number(event.target.value))}
          error={Boolean(fieldErrors.value_min)}
          helperText={
            fieldErrors.value_min
              ? t("providers.validation.backendError", {
                  message: fieldErrors.value_min,
                })
              : undefined
          }
          disabled={loading}
        />

        <TextField
          type="number"
          label={t("providers.wizard.finalForm.maxValue", {
            unit: provider?.unit ?? "",
          })}
          value={valueMax}
          onChange={(event) => setValueMax(Number(event.target.value))}
          error={Boolean(fieldErrors.value_max)}
          helperText={
            fieldErrors.value_max
              ? t("providers.validation.backendError", {
                  message: fieldErrors.value_max,
                })
              : valueMin >= valueMax
              ? t("providers.validation.range")
              : undefined
          }
          disabled={loading}
        />
      </Stack>
    </StickyDialog>
  );
}
