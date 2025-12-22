// ProvidersPage.tsx
import { useEffect, useReducer, useRef, useState } from "react";
import { Alert, Box, Snackbar, Stack, Typography } from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { useProviderDefinitions } from "@/features/providers/hooks/useProviderDefinitions";
import { useMicrocontrollers } from "@/features/providers/hooks/useMicrocontrollers";
import { useMicrocontrollerProviders } from "@/features/providers/hooks/useMicrocontrollerProviders";
import { useMicrocontrollerProviderDefinitions } from "@/features/providers/hooks/useMicrocontrollerProviderDefinitions";
import { useProviderDelete } from "@/features/providers/hooks/useProviderDelete";
import { useProviderSchema } from "@/features/providers/hooks/useProviderSchema";
import { useProviderUpdate } from "@/features/providers/hooks/useProviderUpdate";
import { useUserProviders } from "@/features/providers/hooks/useUserProviders";

import type { ProviderInstance } from "@/features/providers/types/provider";
import { buildInitialFormData, coerceSchemaValues } from "@/features/providers/utils/schemaUtils";
import { parseApiError } from "@/utils/apiErrors";

import AddProviderFlow from "@/features/providers/components/AddProviderFlow";
import ApiProvidersSection from "@/features/providers/components/ApiProvidersSection";
import SensorProvidersSection from "@/features/providers/components/SensorProvidersSection";
import MicrocontrollerSelectorSection from "@/features/providers/components/MicrocontrollerSelectorSection";
import ManualModeInfoSection from "@/features/providers/components/ManualModeInfoSection";
import ProviderDetailsDialog from "@/features/providers/components/ProviderDetailsDialog";
import EditProviderDialog from "@/features/providers/components/EditProviderDialog";

import {
  buildMetadataFromProvider,
  initialState,
  reducer,
  resolveMetadataErrors,
  validateMetadata,
} from "@/features/providers/providers.reducer";

export default function ProvidersPage() {
  const { microcontrollerUuid } = useParams<{ microcontrollerUuid?: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [state, dispatch] = useReducer(reducer, initialState);
  const [selectedMicrocontrollerUuid, setSelectedMicrocontrollerUuid] = useState("");

  /* ===================== DATA ===================== */

  const {
    items: microcontrollers,
    loading: microcontrollerLoading,
    error: microcontrollerError,
  } = useMicrocontrollers(token);

  const {
    providers: sensorProviders,
    loading: sensorLoading,
    error: sensorError,
    reload: reloadSensors,
  } = useMicrocontrollerProviders(selectedMicrocontrollerUuid || null);

  const {
    providers: apiProviders,
    loading: apiLoading,
    error: apiError,
    reload: reloadApiProviders,
  } = useUserProviders();

  const {
    data: definitions,
    loading: definitionsLoading,
    error: definitionsError,
  } = useProviderDefinitions();

  const {
    data: microcontrollerDefinitions,
    loading: microcontrollerDefinitionsLoading,
    error: microcontrollerDefinitionsError,
  } = useMicrocontrollerProviderDefinitions(selectedMicrocontrollerUuid || null);

  /* ===================== EDIT ===================== */

  const { updateProvider, saving } = useProviderUpdate();
  const { deleteProvider, removing } = useProviderDelete();
  const editSchema = useProviderSchema(state.editingProvider?.vendor ?? null);
  const editSeedRef = useRef<string | null>(null);

  useEffect(() => {
    const providerUuid = state.editingProvider?.uuid ?? null;

    if (!providerUuid) {
      editSeedRef.current = null;
      return;
    }
    if (!editSchema.schema) return;
    if (editSeedRef.current === providerUuid) return;

    const base = buildInitialFormData(editSchema.schema, {});
    editSchema.setValues({
      ...base,
      ...(state.editingProvider?.config ?? {}),
    });

    editSeedRef.current = providerUuid;
  }, [state.editingProvider, editSchema.schema, editSchema.setValues]); // avoid depending on whole editSchema object

  /* ===================== INIT ===================== */

  useEffect(() => {
    if (microcontrollerUuid) {
      setSelectedMicrocontrollerUuid(microcontrollerUuid);
      return;
    }
    if (microcontrollers.length === 1) {
      setSelectedMicrocontrollerUuid(microcontrollers[0].uuid);
    }
  }, [microcontrollerUuid, microcontrollers]);

  /* ===================== HANDLERS ===================== */

  const resetUIState = () => {
    dispatch({ type: "RESET_SELECTION" });
    dispatch({ type: "CANCEL_EDIT" });
    dispatch({ type: "CLOSE_ADD" });
    dispatch({ type: "CANCEL_DELETE" });
  };

  const handleMicrocontrollerSelect = (uuid: string) => {
    setSelectedMicrocontrollerUuid(uuid);
    resetUIState();
  };

  const handleDetails = (provider: ProviderInstance) => {
    dispatch({ type: "OPEN_DETAILS", provider });
  };

  const handleEditProvider = (provider: ProviderInstance) => {
    dispatch({
      type: "START_EDIT",
      provider,
      metadata: buildMetadataFromProvider(provider),
    });
  };

  const handleSaveEdit = async () => {
    if (!token || !state.editingProvider?.uuid) return;

    dispatch({ type: "SET_EDIT_SUBMIT_ERROR", error: null });

    const metadataErrors = validateMetadata(state.editMetadata, t);
    dispatch({ type: "SET_EDIT_METADATA_ERRORS", errors: metadataErrors });
    if (Object.keys(metadataErrors).length > 0) return;

    const payload: Record<string, any> = {
      name: state.editMetadata.name.trim(),
      value_min: Number(state.editMetadata.value_min),
      value_max: Number(state.editMetadata.value_max),
      enabled: state.editMetadata.enabled,
    };

    if (editSchema.schema) {
      payload.config = coerceSchemaValues(editSchema.schema, editSchema.values);
    }

    try {
      await updateProvider(state.editingProvider.uuid, payload);
      dispatch({
        type: "SET_TOAST",
        toast: { message: t("providers.notifications.updated"), severity: "success" },
      });

      const isSensor = state.editingProvider.provider_type === "sensor";
      dispatch({ type: "CANCEL_EDIT" });

      if (isSensor) reloadSensors();
      else reloadApiProviders();
    } catch (err) {
      const parsed = parseApiError(err);
      dispatch({ type: "SET_EDIT_SUBMIT_ERROR", error: parsed.message });

      if (parsed.fieldErrors) {
        const { metadataErrors, schemaErrors } = resolveMetadataErrors(parsed.fieldErrors);
        dispatch({ type: "SET_EDIT_METADATA_ERRORS", errors: metadataErrors });
        if (Object.keys(schemaErrors).length > 0) {
          editSchema.setFieldErrors(schemaErrors);
        }
      }
    }
  };

  const handleDelete = async (provider: ProviderInstance) => {
    if (!token || !provider.uuid) return;

    try {
      await deleteProvider(provider.uuid);
      dispatch({
        type: "SET_TOAST",
        toast: { message: t("providers.notifications.deleted"), severity: "success" },
      });

      dispatch({ type: "CANCEL_DELETE" });

      if (state.editingProvider?.uuid === provider.uuid) {
        dispatch({ type: "CANCEL_EDIT" });
      }

      if (provider.provider_type === "sensor") reloadSensors();
      else reloadApiProviders();
    } catch (err) {
      const parsed = parseApiError(err);
      dispatch({
        type: "SET_TOAST",
        toast: { message: parsed.message, severity: "error" },
      });
    }
  };

  const navigateToAttach = (uuid: string) => {
    navigate(`/microcontrollers?attachProvider=${uuid}`);
  };

  const openAddApi = () => {
    dispatch({ type: "SET_TYPE", value: "api" });
    dispatch({ type: "OPEN_ADD" });
  };

  const openAddSensor = () => {
    if (!selectedMicrocontrollerUuid) {
      dispatch({
        type: "SET_TOAST",
        toast: { message: t("providers.notifications.selectMicrocontroller"), severity: "info" },
      });
      return;
    }
    dispatch({ type: "SET_TYPE", value: "sensor" });
    dispatch({ type: "OPEN_ADD" });
  };

  /* ===================== RENDER ===================== */

  return (
    <Box
      p={{ xs: 1.5, md: 3 }}
      sx={{
        minHeight: "100vh",
        background:
          "radial-gradient(circle at top left, rgba(15,139,111,0.12), transparent 45%), radial-gradient(circle at bottom right, rgba(17,61,78,0.12), transparent 40%)",
      }}
    >
      <Stack spacing={0.5} mb={3}>
        <Typography
          variant="h4"
          sx={{
            color: "#f1f7f6",
            textShadow: "0 2px 10px rgba(8,24,36,0.35)",
            letterSpacing: "0.3px",
          }}
        >
          {t("providers.title")}
        </Typography>
        <Typography sx={{ color: "rgba(241,247,246,0.8)" }}>{t("providers.subtitle")}</Typography>
      </Stack>

      <Stack spacing={3}>
        <MicrocontrollerSelectorSection
          microcontrollers={microcontrollers}
          loading={microcontrollerLoading}
          error={microcontrollerError}
          selectedMicrocontrollerUuid={selectedMicrocontrollerUuid}
          onSelect={handleMicrocontrollerSelect}
        />

        <ApiProvidersSection
          providers={apiProviders}
          loading={apiLoading}
          error={apiError}
          onAdd={openAddApi}
          onDetails={handleDetails}
          onEdit={handleEditProvider}
          onCancelEdit={() => dispatch({ type: "CANCEL_EDIT" })}
          editingProviderUuid={state.editingProvider?.uuid ?? null}
          confirmDeleteUuid={state.confirmDeleteUuid}
          deleteDisabled={removing}
          onRequestDelete={(uuid) => dispatch({ type: "REQUEST_DELETE", uuid })}
          onCancelDelete={() => dispatch({ type: "CANCEL_DELETE" })}
          onConfirmDelete={handleDelete}
        />

        {state.addOpen && (
          <AddProviderFlow
            state={state}
            dispatch={dispatch}
            selectedMicrocontrollerUuid={selectedMicrocontrollerUuid}
            definitions={definitions}
            definitionsLoading={definitionsLoading}
            definitionsError={definitionsError}
            microcontrollerDefinitions={microcontrollerDefinitions}
            microcontrollerDefinitionsLoading={microcontrollerDefinitionsLoading}
            microcontrollerDefinitionsError={microcontrollerDefinitionsError}
            reloadSensors={reloadSensors}
            reloadUserProviders={reloadApiProviders}
            navigateToAttach={navigateToAttach}
          />
        )}

        <SensorProvidersSection
          providers={sensorProviders}
          loading={sensorLoading}
          error={sensorError}
          selectedMicrocontrollerUuid={selectedMicrocontrollerUuid}
          onAdd={openAddSensor}
          onDetails={handleDetails}
          onEdit={handleEditProvider}
          onCancelEdit={() => dispatch({ type: "CANCEL_EDIT" })}
          editingProviderUuid={state.editingProvider?.uuid ?? null}
          confirmDeleteUuid={state.confirmDeleteUuid}
          deleteDisabled={removing}
          onRequestDelete={(uuid) => dispatch({ type: "REQUEST_DELETE", uuid })}
          onCancelDelete={() => dispatch({ type: "CANCEL_DELETE" })}
          onConfirmDelete={handleDelete}
        />

        <ManualModeInfoSection />
      </Stack>

      <ProviderDetailsDialog
        open={Boolean(state.detailsProvider)}
        provider={state.detailsProvider}
        onClose={() => dispatch({ type: "CLOSE_DETAILS" })}
      />

      <EditProviderDialog
        open={Boolean(state.editingProvider)}
        provider={state.editingProvider}
        schema={editSchema.schema}
        schemaValues={editSchema.values}
        schemaLoading={editSchema.loading}
        schemaError={editSchema.error}
        fieldErrors={editSchema.fieldErrors}
        metadata={state.editMetadata}
        metadataErrors={state.editMetadataErrors}
        submitError={state.editSubmitError}
        loading={saving}
        onSchemaChange={editSchema.setValue}
        onMetadataChange={(field, value) =>
          dispatch({ type: "UPDATE_EDIT_METADATA", field, value })
        }
        onClose={() => dispatch({ type: "CANCEL_EDIT" })}
        onCancel={() => dispatch({ type: "CANCEL_EDIT" })}   // ✅ fixes your TS error
        onSubmit={handleSaveEdit}
      />

      {state.toast && (
        <Snackbar
          open
          autoHideDuration={2500}
          onClose={() => dispatch({ type: "CLEAR_TOAST" })}
        >
          <Alert
            severity={state.toast.severity}
            onClose={() => dispatch({ type: "CLEAR_TOAST" })}
          >
            {state.toast.message}
          </Alert>
        </Snackbar>
      )}
    </Box>
  );
}
