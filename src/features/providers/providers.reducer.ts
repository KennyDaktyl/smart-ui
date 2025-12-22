import type { TFunction } from "i18next";
import type {
  ProviderDefinition,
  ProviderInstance,
  ProviderMetadataForm,
  ProviderType,
  WizardCredentials,
} from "@/features/providers/types/provider";

type ToastState = {
  message: string;
  severity: "success" | "info" | "error";
};

export type ProvidersState = {
  selectedType: ProviderType | "";
  selectedProvider: ProviderDefinition | null;
  metadata: ProviderMetadataForm;
  metadataErrors: Record<string, string>;
  submitError: string | null;
  toast: ToastState | null;
  wizardConfig: Record<string, any> | null;
  wizardCredentials: WizardCredentials | null;
  addOpen: boolean;
  editingProvider: ProviderInstance | null;
  editMetadata: ProviderMetadataForm;
  editMetadataErrors: Record<string, string>;
  editSubmitError: string | null;
  detailsProvider: ProviderInstance | null;
  confirmDeleteUuid: string | null;
};
export type ProvidersAction =
  | { type: "SET_TYPE"; value: ProviderType }
  | { type: "SELECT_PROVIDER"; provider: ProviderDefinition }
  | { type: "RESET_SELECTION" }
  | { type: "OPEN_ADD" }
  | { type: "CLOSE_ADD" }
  | { type: "UPDATE_METADATA"; field: keyof ProviderMetadataForm; value: string | boolean }
  | { type: "SET_METADATA_ERRORS"; errors: Record<string, string> }
  | { type: "SET_SUBMIT_ERROR"; error: string | null }
  | { type: "SET_TOAST"; toast: ToastState }
  | { type: "CLEAR_TOAST" }
  | {
      type: "SET_WIZARD_CONFIG";
      config: Record<string, any>;
      credentials: WizardCredentials | null;
    }
  | { type: "START_EDIT"; provider: ProviderInstance; metadata: ProviderMetadataForm }
  | { type: "CANCEL_EDIT" }
  | { type: "UPDATE_EDIT_METADATA"; field: keyof ProviderMetadataForm; value: string | boolean }
  | { type: "SET_EDIT_METADATA_ERRORS"; errors: Record<string, string> }
  | { type: "SET_EDIT_SUBMIT_ERROR"; error: string | null }
  | { type: "OPEN_DETAILS"; provider: ProviderInstance }
  | { type: "CLOSE_DETAILS" }
  | { type: "REQUEST_DELETE"; uuid: string }
  | { type: "CANCEL_DELETE" };

export const EMPTY_METADATA: ProviderMetadataForm = {
  name: "",
  value_min: "",
  value_max: "",
  enabled: true,
};

export const buildMetadataFromProvider = (provider: ProviderInstance): ProviderMetadataForm => ({
  name: provider.name ?? "",
  value_min: provider.value_min != null ? String(provider.value_min) : "",
  value_max: provider.value_max != null ? String(provider.value_max) : "",
  enabled: provider.enabled ?? true,
});

export const initialState: ProvidersState = {
  selectedType: "",
  selectedProvider: null,
  metadata: EMPTY_METADATA,
  metadataErrors: {},
  submitError: null,
  toast: null,
  wizardConfig: null,
  wizardCredentials: null,
  addOpen: false,
  editingProvider: null,
  editMetadata: EMPTY_METADATA,
  editMetadataErrors: {},
  editSubmitError: null,
  detailsProvider: null,
  confirmDeleteUuid: null,
};

export const reducer = (state: ProvidersState, action: ProvidersAction): ProvidersState => {
  switch (action.type) {
    case "SET_TYPE":
      return {
        ...state,
        selectedType: action.value,
        selectedProvider: null,
        metadata: EMPTY_METADATA,
        metadataErrors: {},
        submitError: null,
        wizardConfig: null,
        wizardCredentials: null,
      };
    case "SELECT_PROVIDER":
      return {
        ...state,
        selectedProvider: action.provider,
        metadata: EMPTY_METADATA,
        metadataErrors: {},
        submitError: null,
        wizardConfig: null,
        wizardCredentials: null,
      };
    case "RESET_SELECTION":
      return {
        ...state,
        selectedProvider: null,
        metadata: EMPTY_METADATA,
        metadataErrors: {},
        submitError: null,
        wizardConfig: null,
        wizardCredentials: null,
      };
    case "OPEN_ADD":
      return { ...state, addOpen: true };
    case "CLOSE_ADD":
      return {
        ...state,
        addOpen: false,
        selectedProvider: null,
        metadata: EMPTY_METADATA,
        metadataErrors: {},
        submitError: null,
        wizardConfig: null,
        wizardCredentials: null,
      };
    case "UPDATE_METADATA":
      return {
        ...state,
        metadata: { ...state.metadata, [action.field]: action.value },
        metadataErrors: { ...state.metadataErrors, [action.field]: "" },
      };
    case "SET_METADATA_ERRORS":
      return { ...state, metadataErrors: action.errors };
    case "SET_SUBMIT_ERROR":
      return { ...state, submitError: action.error };
    case "SET_TOAST":
      return { ...state, toast: action.toast };
    case "CLEAR_TOAST":
      return { ...state, toast: null };
    case "SET_WIZARD_CONFIG":
      return {
        ...state,
        wizardConfig: action.config,
        wizardCredentials: action.credentials,
      };
    case "START_EDIT":
      return {
        ...state,
        editingProvider: action.provider,
        editMetadata: action.metadata,
        editMetadataErrors: {},
        editSubmitError: null,
      };
    case "CANCEL_EDIT":
      return {
        ...state,
        editingProvider: null,
        editMetadata: EMPTY_METADATA,
        editMetadataErrors: {},
        editSubmitError: null,
      };
    case "UPDATE_EDIT_METADATA":
      return {
        ...state,
        editMetadata: { ...state.editMetadata, [action.field]: action.value },
        editMetadataErrors: { ...state.editMetadataErrors, [action.field]: "" },
      };
    case "SET_EDIT_METADATA_ERRORS":
      return { ...state, editMetadataErrors: action.errors };
    case "SET_EDIT_SUBMIT_ERROR":
      return { ...state, editSubmitError: action.error };
    case "OPEN_DETAILS":
      return { ...state, detailsProvider: action.provider };
    case "CLOSE_DETAILS":
      return { ...state, detailsProvider: null };
    case "REQUEST_DELETE":
      return { ...state, confirmDeleteUuid: action.uuid };
    case "CANCEL_DELETE":
      return { ...state, confirmDeleteUuid: null };
    default:
      return state;
  }
};

export const resolveMetadataErrors = (
  fieldErrors: Record<string, string>
): { metadataErrors: Record<string, string>; schemaErrors: Record<string, string> } => {
  const metadataKeys = new Set(["name", "value_min", "value_max", "enabled"]);
  const metadataErrors: Record<string, string> = {};
  const schemaErrors: Record<string, string> = {};

  Object.entries(fieldErrors).forEach(([key, value]) => {
    if (metadataKeys.has(key)) {
      metadataErrors[key] = value;
    } else {
      schemaErrors[key] = value;
    }
  });

  return { metadataErrors, schemaErrors };
};

export const validateMetadata = (metadata: ProviderMetadataForm, t: TFunction) => {
  const errors: Record<string, string> = {};
  if (!metadata.name.trim()) {
    errors.name = t("providers.validation.nameRequired");
  }
  if (metadata.value_min === "" || Number.isNaN(Number(metadata.value_min))) {
    errors.value_min = t("providers.validation.minRequired");
  }
  if (metadata.value_max === "" || Number.isNaN(Number(metadata.value_max))) {
    errors.value_max = t("providers.validation.maxRequired");
  }
  return errors;
};
