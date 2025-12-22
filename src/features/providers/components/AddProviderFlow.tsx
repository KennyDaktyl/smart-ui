import { useEffect, useMemo, type Dispatch } from "react";
import { Alert, Box, Card, CardContent, CircularProgress, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import ProviderFinalizationForm from "@/features/providers/components/ProviderFinalizationForm";
import ProviderList from "@/features/providers/components/ProviderList";
import ProviderSchemaForm from "@/features/providers/components/ProviderSchemaForm";
import ProviderTypeSelector from "@/features/providers/components/ProviderTypeSelector";
import ProviderWizardInline from "@/features/providers/components/ProviderWizardInline";
import { useProviderCreation } from "@/features/providers/hooks/useProviderCreation";
import { useProviderSchema } from "@/features/providers/hooks/useProviderSchema";
import type { ProviderDefinitions } from "@/features/providers/hooks/useMicrocontrollerProviderDefinitions";
import { coerceSchemaValues } from "@/features/providers/utils/schemaUtils";
import type { VendorDefinition } from "@/features/providers/types/provider";
import type { ProvidersAction, ProvidersState } from "@/features/providers/providers.reducer";
import { resolveMetadataErrors, validateMetadata } from "@/features/providers/providers.reducer";
import { parseApiError } from "@/utils/apiErrors";

type AddProviderFlowProps = {
  state: ProvidersState;
  dispatch: Dispatch<ProvidersAction>;
  selectedMicrocontrollerUuid: string;
  definitions: ProviderDefinitions | null;
  definitionsLoading: boolean;
  definitionsError: string | null;
  microcontrollerDefinitions: ProviderDefinitions | null;
  microcontrollerDefinitionsLoading: boolean;
  microcontrollerDefinitionsError: string | null;
  reloadSensors: () => void;
  reloadUserProviders: () => void;
  navigateToAttach: (providerUuid: string) => void;
};

export default function AddProviderFlow({
  state,
  dispatch,
  selectedMicrocontrollerUuid,
  definitions,
  definitionsLoading,
  definitionsError,
  microcontrollerDefinitions,
  microcontrollerDefinitionsLoading,
  microcontrollerDefinitionsError,
  reloadSensors,
  reloadUserProviders,
  navigateToAttach,
}: AddProviderFlowProps) {
  const { t } = useTranslation();
  const { createProvider, creating } = useProviderCreation();

  const providerTypes = useMemo(() => {
    if (state.selectedType === "sensor") {
      return microcontrollerDefinitions?.provider_types ?? [];
    }
    return definitions?.provider_types ?? [];
  }, [definitions, microcontrollerDefinitions, state.selectedType]);

  useEffect(() => {
    if (!state.selectedType && providerTypes.length > 0) {
      dispatch({ type: "SET_TYPE", value: providerTypes[0].type });
    }
  }, [dispatch, providerTypes, state.selectedType]);

  const selectedVendors = useMemo(() => {
    if (!state.selectedType) return [];
    const match = providerTypes.find((item) => item.type === state.selectedType);
    return match?.vendors ?? [];
  }, [providerTypes, state.selectedType]);

  const activeDefinitionsLoading =
    state.selectedType === "sensor" ? microcontrollerDefinitionsLoading : definitionsLoading;
  const activeDefinitionsError =
    state.selectedType === "sensor" ? microcontrollerDefinitionsError : definitionsError;

  const selectedVendorForSchema =
    state.selectedProvider && !state.selectedProvider.requires_wizard ? state.selectedProvider.vendor : null;

  const providerSchema = useProviderSchema(selectedVendorForSchema);

  useEffect(() => {
    if (!state.addOpen || !state.selectedProvider || state.selectedProvider.requires_wizard) return;
    if (!providerSchema.schema) return;
    const defaultUnit = state.selectedProvider.default_unit;
    if (!defaultUnit) return;
    const currentUnit = providerSchema.values.unit;
    if (currentUnit === undefined || currentUnit === "" || currentUnit === null) {
      providerSchema.setValue("unit", defaultUnit);
    }
  }, [
    state.addOpen,
    state.selectedProvider,
    providerSchema.schema,
    providerSchema.values.unit,
    providerSchema.setValue,
  ]);

  const handleProviderSelect = (vendor: VendorDefinition) => {
    if (!state.selectedType) return;
    dispatch({
      type: "SELECT_PROVIDER",
      provider: { ...vendor, provider_type: state.selectedType },
    });
  };

  const handleMetadataChange = (field: keyof ProvidersState["metadata"], value: string | boolean) => {
    dispatch({ type: "UPDATE_METADATA", field, value });
  };

  const showFinalization =
    state.addOpen && state.selectedProvider
      ? state.selectedProvider.requires_wizard
        ? Boolean(state.wizardConfig)
        : Boolean(providerSchema.schema)
      : false;

  const handleCreateProvider = async () => {
    if (!state.selectedProvider) return;
    const metadataErrors = validateMetadata(state.metadata, t);
    dispatch({ type: "SET_METADATA_ERRORS", errors: metadataErrors });
    if (Object.keys(metadataErrors).length > 0) {
      return;
    }

    let config: Record<string, any> | null = null;
    if (state.selectedProvider.requires_wizard) {
      config = state.wizardConfig;
    } else if (providerSchema.schema) {
      config = coerceSchemaValues(providerSchema.schema, providerSchema.values);
    }

    if (!config) {
      dispatch({ type: "SET_SUBMIT_ERROR", error: t("providers.errors.incompleteConfig") });
      return;
    }

    try {
      const createdProvider = await createProvider(
        {
          name: state.metadata.name.trim(),
          provider_type: state.selectedProvider.provider_type,
          kind: state.selectedProvider.kind,
          vendor: state.selectedProvider.vendor,
          unit: state.selectedProvider.default_unit,
          value_min: Number(state.metadata.value_min),
          value_max: Number(state.metadata.value_max),
          enabled: state.metadata.enabled,
          config,
          credentials: state.wizardCredentials ?? undefined,
        },
        {
          providerType: state.selectedProvider.provider_type,
          microcontrollerUuid:
            state.selectedProvider.provider_type === "sensor"
              ? selectedMicrocontrollerUuid || undefined
              : undefined,
        }
      );
      dispatch({
        type: "SET_TOAST",
        toast: { message: t("providers.notifications.created"), severity: "success" },
      });
      if (
        state.selectedProvider.provider_type === "api" &&
        state.selectedProvider.requires_wizard &&
        createdProvider?.uuid
      ) {
        navigateToAttach(createdProvider.uuid);
        return;
      }
      dispatch({ type: "CLOSE_ADD" });
      if (state.selectedProvider.provider_type === "sensor") {
        reloadSensors();
      } else {
        reloadUserProviders();
      }
    } catch (err) {
      const parsed = parseApiError(err);
      dispatch({ type: "SET_SUBMIT_ERROR", error: parsed.message });
      if (parsed.fieldErrors) {
        const { metadataErrors, schemaErrors } = resolveMetadataErrors(parsed.fieldErrors);
        dispatch({ type: "SET_METADATA_ERRORS", errors: metadataErrors });
        if (Object.keys(schemaErrors).length > 0) {
          providerSchema.setFieldErrors(schemaErrors);
        }
      }
    }
  };

  const providerCard = {
    borderRadius: 2.5,
    border: "1px solid rgba(13,27,42,0.08)",
    backgroundColor: "#ffffff",
    boxShadow: "0 12px 30px rgba(8,24,36,0.08)",
  };

  return (
    <>
      <Card sx={providerCard}>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="baseline">
              <Typography variant="h6">{t("providers.addSectionTitle")}</Typography>
              <Typography variant="body2" color="text.secondary">
                {t("providers.addSectionSubtitle")}
              </Typography>
            </Stack>
            {activeDefinitionsError && <Alert severity="error">{activeDefinitionsError}</Alert>}
            {activeDefinitionsLoading ? (
              <Box display="flex" justifyContent="center" py={3}>
                <CircularProgress />
              </Box>
            ) : (
              <>
                <ProviderTypeSelector
                  types={providerTypes}
                  selectedType={state.selectedType}
                  onSelect={(type) => dispatch({ type: "SET_TYPE", value: type })}
                />
                <ProviderList
                  vendors={selectedVendors}
                  selectedVendor={state.selectedProvider?.vendor ?? null}
                  onSelect={handleProviderSelect}
                  onClearSelection={() => dispatch({ type: "RESET_SELECTION" })}
                />
              </>
            )}
          </Stack>
        </CardContent>
      </Card>

      {state.selectedProvider && !state.selectedProvider.requires_wizard && (
        <Card sx={providerCard}>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="h6">{t("providers.configurationTitle")}</Typography>
              {providerSchema.error && <Alert severity="error">{providerSchema.error}</Alert>}
              <ProviderSchemaForm
                schema={providerSchema.schema}
                values={providerSchema.values}
                errors={providerSchema.fieldErrors}
                loading={providerSchema.loading}
                onChange={providerSchema.setValue}
              />
            </Stack>
          </CardContent>
        </Card>
      )}

      {state.selectedProvider?.requires_wizard && (
        <ProviderWizardInline
          vendor={state.selectedProvider.vendor}
          onComplete={(finalConfig, credentials) => {
            dispatch({
              type: "SET_WIZARD_CONFIG",
              config: finalConfig,
              credentials: credentials ?? null,
            });
          }}
          onStepSaved={() =>
            dispatch({
              type: "SET_TOAST",
              toast: { message: t("providers.notifications.stepSaved"), severity: "info" },
            })
          }
        />
      )}

      {showFinalization && (
        <Card sx={providerCard}>
          <CardContent>
            <ProviderFinalizationForm
              metadata={state.metadata}
              errors={state.metadataErrors}
              submitError={state.submitError}
              loading={creating}
              onChange={handleMetadataChange}
              onSubmit={handleCreateProvider}
            />
          </CardContent>
        </Card>
      )}
    </>
  );
}
