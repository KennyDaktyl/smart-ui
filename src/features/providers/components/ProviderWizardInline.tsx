import { useEffect, useMemo, useRef } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";

import ProviderSchemaForm from "@/features/providers/components/ProviderSchemaForm";
import { useProviderWizard } from "@/features/providers/hooks/useProviderWizard";
import type { WizardCredentials } from "@/features/providers/types/provider";
import { useTranslation } from "react-i18next";

const buildStepTitle = (t: (key: string, opts?: any) => string, index: number, label: string) =>
  label ? t("providers.wizard.stepWithLabel", { index: index + 1, label }) : t("providers.wizard.step", { index: index + 1 });

type ProviderWizardInlineProps = {
  vendor: string;
  onComplete: (config: Record<string, any>, credentials?: WizardCredentials) => void;
  onStepSaved?: () => void;
};

export default function ProviderWizardInline({ vendor, onComplete, onStepSaved }: ProviderWizardInlineProps) {
  const wizard = useProviderWizard(vendor);
  const completionRef = useRef(false);
  const { t } = useTranslation();
  const {
    completedSteps,
    consumeCredentials,
    currentStep,
    error,
    fieldErrors,
    finalConfig,
    isComplete,
    loading,
    reset,
    start,
    submitStep,
    updateValue,
  } = wizard;

  useEffect(() => {
    reset();
    completionRef.current = false;
    start();
  }, [vendor, reset, start]);

  useEffect(() => {
    if (!isComplete || !finalConfig || completionRef.current) return;
    completionRef.current = true;
    const credentials = consumeCredentials() ?? undefined;
    onComplete(finalConfig, credentials);
  }, [isComplete, finalConfig, consumeCredentials, onComplete]);

  const steps = useMemo(() => {
    const current = currentStep ? [currentStep] : [];
    return [...completedSteps, ...current];
  }, [completedSteps, currentStep]);

  const handleContinue = async () => {
    const saved = await submitStep();
    if (saved && onStepSaved) {
      onStepSaved();
    }
  };

  return (
    <Stack spacing={2}>
      {error && <Alert severity="error">{error}</Alert>}

      {loading && steps.length === 0 && (
        <Box display="flex" justifyContent="center" py={2}>
          <CircularProgress />
        </Box>
      )}

      {steps.length === 0 && !loading && !isComplete && (
        <Typography variant="body2" sx={{ color: "rgba(13,27,42,0.7)" }}>
          {t("providers.wizard.waitingStart")}
        </Typography>
      )}

      {steps.map((step, index) => {
        const isCurrent = !step.completed;
        return (
          <Card key={`${step.step}-${index}`} sx={{ borderRadius: 2 }}>
            <CardContent>
              <Stack spacing={1.5}>
                <Stack spacing={0.5}>
                  <Typography variant="subtitle1">{buildStepTitle(t, index, step.step)}</Typography>
                  {step.completed && (
                    <Typography variant="caption" sx={{ color: "rgba(13,27,42,0.6)" }}>
                      {t("providers.wizard.completed")}
                    </Typography>
                  )}
                </Stack>

                {step.schema ? (
                  <ProviderSchemaForm
                    schema={step.schema}
                    options={step.options}
                    values={step.values}
                    errors={isCurrent ? fieldErrors : undefined}
                    disabled={!isCurrent || loading}
                    onChange={updateValue}
                  />
                ) : (
                  <Typography variant="body2" sx={{ color: "rgba(13,27,42,0.7)" }}>
                    {t("providers.wizard.waitingStep")}
                  </Typography>
                )}

                {isCurrent && !isComplete && (
                  <Button
                    variant="contained"
                    onClick={handleContinue}
                    disabled={loading || !step.schema}
                  >
                    {loading ? <CircularProgress size={20} /> : t("providers.wizard.continue")}
                  </Button>
                )}
              </Stack>
            </CardContent>
          </Card>
        );
      })}

      {isComplete && (
        <Alert severity="success">{t("providers.wizard.completeNotice")}</Alert>
      )}
    </Stack>
  );
}
