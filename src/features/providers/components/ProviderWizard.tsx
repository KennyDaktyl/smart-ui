import { useEffect, useMemo, useRef, useState } from "react";
import { Alert, Box, Button, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import SchemaForm from "@/features/providers/components/SchemaForm";
import { useProviderWizard } from "@/features/providers/hooks/useProviderWizard";

type ProviderWizardProps = {
  open: boolean;
  vendor: string;
  onClose: () => void;
  onComplete: (finalConfig: Record<string, any>, credentials?: { username: string; password: string }) => void;
};

const buildInitialFormData = (schema: any, prev: Record<string, any>) => {
  if (!schema?.properties) return {};
  const next: Record<string, any> = {};
  Object.entries(schema.properties).forEach(([key, field]) => {
    if (prev[key] !== undefined) {
      next[key] = prev[key];
      return;
    }
    if (field?.default !== undefined) {
      next[key] = field.default;
      return;
    }
    if (field?.type === "boolean") {
      next[key] = false;
      return;
    }
    next[key] = "";
  });
  return next;
};

const applyContextToForm = (schema: any, base: Record<string, any>, context: Record<string, any> | null) => {
  if (!schema?.properties || !context) return base;
  const next = { ...base };
  Object.keys(schema.properties).forEach((key) => {
    if (key in context && context[key] != null) {
      next[key] = context[key];
    }
  });
  return next;
};

const coerceSchemaValues = (schema: any, values: Record<string, any>) => {
  if (!schema?.properties) return values;
  const payload: Record<string, any> = {};
  Object.entries(schema.properties).forEach(([key, field]) => {
    const rawValue = values[key];
    if ((field?.type === "number" || field?.type === "integer") && rawValue !== "") {
      payload[key] = Number(rawValue);
    } else {
      payload[key] = rawValue;
    }
  });
  return payload;
};

export default function ProviderWizard({ open, vendor, onClose, onComplete }: ProviderWizardProps) {
  const wizard = useProviderWizard(open ? vendor : null);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const completedRef = useRef(false);
  const { t } = useTranslation();

  useEffect(() => {
    if (!open) return;
    wizard.reset();
    completedRef.current = false;
    wizard.start();
  }, [open, vendor]);

  useEffect(() => {
    if (!wizard.schema) return;
    setFormData((prev) => {
      const base = buildInitialFormData(wizard.schema, prev);
      return applyContextToForm(wizard.schema, base, wizard.context);
    });
  }, [wizard.schema, wizard.context]);

  useEffect(() => {
    if (!wizard.isComplete || !wizard.finalConfig || completedRef.current) return;
    completedRef.current = true;
    const credentials = wizard.consumeCredentials() ?? undefined;
    onComplete(wizard.finalConfig, credentials);
  }, [wizard.isComplete, wizard.finalConfig, onComplete, wizard]);

  const stepLabel = useMemo(() => {
    if (wizard.step) return wizard.step;
    return "";
  }, [wizard.step]);

  const handleChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleContinue = async () => {
    if (!wizard.schema) return;
    const payload = coerceSchemaValues(wizard.schema, formData);
    await wizard.submitStep(payload);
  };

  const handleUseConfig = () => {
    if (!wizard.finalConfig) return;
    const credentials = wizard.consumeCredentials() ?? undefined;
    onComplete(wizard.finalConfig, credentials);
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{t("providers.wizard.modalTitle")}</DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {wizard.error && <Alert severity="error">{wizard.error}</Alert>}

          {!wizard.isComplete && wizard.step && (
            <Stack spacing={0.5}>
              <Typography variant="subtitle1">{stepLabel}</Typography>
              {wizard.schema?.title && (
                <Typography variant="body2" sx={{ color: "rgba(13,27,42,0.7)" }}>
                  {wizard.schema.title}
                </Typography>
              )}
              {wizard.schema?.description && (
                <Typography variant="body2" sx={{ color: "rgba(13,27,42,0.7)" }}>
                  {wizard.schema.description}
                </Typography>
              )}
            </Stack>
          )}

          {!wizard.isComplete && wizard.schema && (
            <SchemaForm
              schema={wizard.schema}
              options={wizard.options ?? undefined}
              values={formData}
              errors={wizard.fieldErrors}
              disabled={wizard.loading}
              onChange={handleChange}
            />
          )}

          {!wizard.isComplete && !wizard.schema && !wizard.loading && (
            <Typography variant="body2" sx={{ color: "rgba(13,27,42,0.7)" }}>
              {t("providers.wizard.waitingStep")}
            </Typography>
          )}

          {wizard.isComplete && (
            <Alert severity="success">
              {t("providers.wizard.completeNotice")}
            </Alert>
          )}
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={wizard.loading}>
          {t("providers.actions.cancel")}
        </Button>
        {!wizard.isComplete && (
          <Button variant="contained" onClick={handleContinue} disabled={wizard.loading || !wizard.schema}>
            {wizard.loading ? <CircularProgress size={20} /> : t("providers.wizard.continue")}
          </Button>
        )}
        {wizard.isComplete && (
          <Button variant="contained" onClick={handleUseConfig}>
            {t("providers.wizard.useConfig")}
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
}
