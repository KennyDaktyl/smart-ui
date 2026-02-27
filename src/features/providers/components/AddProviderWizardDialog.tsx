import {
  Button,
  Stepper,
  Step,
  StepLabel,
  Typography,
  Box,
} from "@mui/material";
import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";

import CenteredSpinner from "@/features/common/components/CenteredSpinner";
import { useProviderDefinitions } from "../hooks/useProviderDefinitions";
import SelectProviderStep from "./wizard/SelectProviderStep";
import { ProviderDefinitionVendor } from "../types/provider";
import { providersWizardApi } from "@/api/providersWizardApi";
import WizardSchemaForm from "../schemas/WizardSchemaForm";
import ProviderFinalForm from "../schemas/ProviderFinalForm";
import { providersApi } from "@/api/providersApi";
import { useToast } from "@/context/ToastContext";
import { parseApiError, ParsedApiError } from "@/api/parseApiError";
import { StickyDialog } from "@/components/dialogs/StickyDialog";

type Props = {
  open: boolean;
  onClose: (shouldReload?: boolean) => void;
};

const steps = [
  "providers.wizard.steps.provider",
  "providers.wizard.steps.config",
  "providers.wizard.steps.summary",
];
const WIZARD_FORM_ID = "provider-wizard-step-form";
const FINAL_FORM_ID = "provider-wizard-final-form";

export default function AddProviderWizardDialog({
  open,
  onClose,
}: Props) {
  const { t } = useTranslation();
  const { notifyError, notifySuccess } = useToast();

  /* -------------------------------------------------
   * Local state
   * ------------------------------------------------- */
  const [activeStep, setActiveStep] = useState(0);
  const [selectedVendor, setSelectedVendor] =
    useState<ProviderDefinitionVendor | null>(null);

  // wizard runtime state
  const [wizardData, setWizardData] =
    useState<any>(null);
  const [wizardLoading, setWizardLoading] =
    useState(false);
  const [wizardError, setWizardError] =
    useState<string | null>(null);
  const [wizardFieldErrors, setWizardFieldErrors] =
    useState<Record<string, string>>({});

  // final data
  const [finalConfig, setFinalConfig] =
    useState<Record<string, any> | null>(null);
  const [finalFieldErrors, setFinalFieldErrors] =
    useState<Record<string, string>>({});
  const [finalLoading, setFinalLoading] =
    useState(false);
  const [finalError, setFinalError] =
    useState<string | null>(null);

  /* -------------------------------------------------
   * Provider definitions (step 0)
   * ------------------------------------------------- */
  const {
    data: definitions,
    loading: definitionsLoading,
    error: definitionsError,
  } = useProviderDefinitions();

  const apiVendors = useMemo(() => {
    const apiType = definitions.find(
      (t) => t.type === "api"
    );
    return apiType?.vendors ?? [];
  }, [definitions]);

  useEffect(() => {
    if (!open) {
      setActiveStep(0);
      setSelectedVendor(null);
      setWizardData(null);
      setFinalConfig(null);
      setWizardError(null);
      setFinalError(null);
      setWizardFieldErrors({});
      setFinalFieldErrors({});
      setFinalLoading(false);
      setWizardLoading(false);
    }
  }, [open]);

  /* -------------------------------------------------
   * Step handlers
   * ------------------------------------------------- */

  const translateErrorMessage = (
    key: string,
    parsed: ParsedApiError
  ) => {
    const message = t(key, {
      message: parsed.message,
    });
    notifyError(message);
    return message;
  };

  // STEP 0 → STEP 1
  const handleStartWizard = async () => {
    if (!selectedVendor) return;

    if (!selectedVendor.requires_wizard) {
      // w przyszłości: simple config
      setActiveStep(2);
      return;
    }

    setWizardLoading(true);
    setWizardError(null);
    setWizardFieldErrors({});

    try {
      const res =
        await providersWizardApi.startWizard(
          selectedVendor.vendor
        );
      setWizardData(res.data);
      setActiveStep(1);
    } catch (e: any) {
      const parsed = parseApiError(e);
      const message = translateErrorMessage(
        "providers.errors.wizardStart",
        parsed
      );
      setWizardError(message);
      setWizardFieldErrors(parsed.fieldErrors ?? {});
    } finally {
      setWizardLoading(false);
    }
  };

  // SUBMIT WIZARD STEP
  const handleSubmitWizardStep = async (
    values: Record<string, any>
  ) => {
    if (!selectedVendor || !wizardData) return;

    setWizardLoading(true);
    setWizardError(null);
    setWizardFieldErrors({});

    try {
      const res =
        await providersWizardApi.submitStep(
          selectedVendor.vendor,
          wizardData.step,
          values,
          wizardData.context
        );

      setWizardData(res.data);

      if (res.data.is_complete) {
        setFinalConfig(res.data.final_config ?? null);
        setActiveStep(2);
      }
    } catch (e: any) {
      const parsed = parseApiError(e);
      const message = translateErrorMessage(
        "providers.errors.wizardStep",
        parsed
      );
      setWizardError(message);
      setWizardFieldErrors(parsed.fieldErrors ?? {});
    } finally {
      setWizardLoading(false);
    }
  };

  const handleCreateProvider = async (form: {
    name: string;
  }) => {
    if (!selectedVendor) return;

    setFinalLoading(true);
    setFinalError(null);
    setFinalFieldErrors({});

    try {
      await providersApi.createProvider({
        name: form.name,

        provider_type: "api",
        kind: selectedVendor.kind,
        vendor: selectedVendor.vendor,

        unit: selectedVendor.default_unit,

        wizard_session_id:
          wizardData?.context?.wizard_session_id,
      });

      notifySuccess(t("providers.success.create"));
      onClose(true);
    } catch (e: any) {
      const parsed = parseApiError(e);
      const message = translateErrorMessage(
        "providers.errors.final",
        parsed
      );
      setFinalError(message);
      setFinalFieldErrors(parsed.fieldErrors ?? {});
    } finally {
      setFinalLoading(false);
    }
  };

  /* -------------------------------------------------
   * RENDER HELPERS
   * ------------------------------------------------- */

  const renderWizardForm = () => {
    if (!wizardData?.schema) return null;

    return (
      <WizardSchemaForm
        formId={WIZARD_FORM_ID}
        hideSubmitButton
        schema={wizardData.schema}
        options={wizardData.options}
        context={wizardData.context}
        loading={wizardLoading}
        fieldErrors={wizardFieldErrors}
        onSubmit={handleSubmitWizardStep}
      />
    );
  };

  /* -------------------------------------------------
   * RENDER
   * ------------------------------------------------- */

  return (
    <StickyDialog
      open={open}
      onClose={() => onClose(false)}
      maxWidth="md"
      title={t("providers.actions.add")}
      actions={
        <>
          <Button onClick={() => onClose(false)}>
            {t("common.cancel")}
          </Button>

          {activeStep === 0 && (
            <Button
              variant="contained"
              onClick={handleStartWizard}
              disabled={!selectedVendor || wizardLoading}
            >
              {t("common.next")}
            </Button>
          )}

          {activeStep === 1 && (
            <Button
              type="submit"
              form={WIZARD_FORM_ID}
              variant="contained"
              disabled={wizardLoading || !wizardData}
            >
              {t("providers.wizard.actions.next")}
            </Button>
          )}

          {activeStep === 2 && (
            <Button
              type="submit"
              form={FINAL_FORM_ID}
              variant="contained"
              disabled={finalLoading || !finalConfig || !selectedVendor}
            >
              {t("providers.actions.create")}
            </Button>
          )}
        </>
      }
    >
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{t(label)}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {/* STEP 0 */}
        {definitionsLoading && <CenteredSpinner />}

        {definitionsError && (
          <Typography color="error">
            {definitionsError.message}
          </Typography>
        )}

        {!definitionsLoading &&
          !definitionsError &&
          activeStep === 0 && (
            <SelectProviderStep
              vendors={apiVendors}
              selectedVendor={selectedVendor ?? undefined}
              onSelect={setSelectedVendor}
            />
          )}

        {/* STEP 1 – WIZARD */}
        {activeStep === 1 && (
          <>
            {wizardLoading && <CenteredSpinner />}

            {wizardError && (
              <Typography color="error">
                {wizardError}
              </Typography>
            )}

            {!wizardLoading &&
              wizardData &&
              renderWizardForm()}
          </>
        )}

        {activeStep === 2 && finalConfig && selectedVendor && (
          <Box display="flex" flexDirection="column" gap={3}>
            <Typography variant="h6">
              {t("providers.wizard.final")}
            </Typography>

            {finalLoading && (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                }}
              >
                <CenteredSpinner />
              </Box>
            )}

            {finalError && (
              <Typography color="error">
                {finalError}
              </Typography>
            )}

            <ProviderFinalForm
              formId={FINAL_FORM_ID}
              hideSubmitButton
              defaultUnit={selectedVendor.default_unit}
              onSubmit={handleCreateProvider}
              loading={finalLoading}
              errors={finalFieldErrors}
            />
          </Box>
        )}
    </StickyDialog>
  );
}
