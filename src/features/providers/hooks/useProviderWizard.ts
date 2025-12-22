import { useCallback, useReducer } from "react";
import axios from "axios";

import { providerApi } from "@/api/providerApi";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { parseApiError } from "@/utils/apiErrors";
import {
  applyContextToForm,
  buildInitialFormData,
  coerceSchemaValues,
} from "@/features/providers/utils/schemaUtils";
import type { WizardCredentials } from "@/features/providers/types/provider";

type WizardResponse = {
  step?: string | null;
  schema?: Record<string, any>;
  next_step?: string | null;
  next_schema?: Record<string, any>;
  options?: Record<string, any>;
  context?: Record<string, any>;
  is_complete: boolean;
  final_config?: Record<string, any>;
  credentials?: WizardCredentials;
};

type WizardStepState = {
  step: string;
  schema: Record<string, any> | null;
  options: Record<string, any> | null;
  values: Record<string, any>;
  completed: boolean;
};

type WizardState = {
  completedSteps: WizardStepState[];
  currentStep: WizardStepState | null;
  context: Record<string, any> | null;
  isComplete: boolean;
  finalConfig: Record<string, any> | null;
  loading: boolean;
  error: string | null;
  fieldErrors: Record<string, string>;
  credentials: WizardCredentials | null;
};

type WizardAction =
  | { type: "RESET" }
  | { type: "LOAD_START" }
  | { type: "APPLY_RESPONSE"; response: WizardResponse }
  | { type: "SET_ERROR"; error: string; fieldErrors?: Record<string, string> }
  | { type: "EXPIRE"; error: string }
  | { type: "UPDATE_VALUE"; key: string; value: any }
  | { type: "SET_CREDENTIALS"; credentials: WizardCredentials }
  | { type: "CLEAR_CREDENTIALS" };

const initialState: WizardState = {
  completedSteps: [],
  currentStep: null,
  context: null,
  isComplete: false,
  finalConfig: null,
  loading: false,
  error: null,
  fieldErrors: {},
  credentials: null,
};

const createStep = (
  step: string | null,
  schema: Record<string, any> | null,
  options: Record<string, any> | null,
  context: Record<string, any> | null
): WizardStepState | null => {
  if (!step && !schema) return null;
  const base = buildInitialFormData(schema, {});
  const values = applyContextToForm(schema, base, context);
  return {
    step: step ?? "",
    schema,
    options,
    values,
    completed: false,
  };
};

const reducer = (state: WizardState, action: WizardAction): WizardState => {
  switch (action.type) {
    case "RESET":
      return initialState;
    case "LOAD_START":
      return { ...state, loading: true, error: null, fieldErrors: {} };
    case "APPLY_RESPONSE": {
      const response = action.response;
      const nextContext = response.context ?? state.context;
      const completedSteps = state.currentStep
        ? [...state.completedSteps, { ...state.currentStep, completed: true }]
        : state.completedSteps;

      if (response.is_complete) {
        return {
          ...state,
          completedSteps,
          currentStep: null,
          context: nextContext,
          isComplete: true,
          finalConfig: response.final_config ?? null,
          loading: false,
          error: null,
          fieldErrors: {},
          credentials: response.credentials ?? state.credentials,
        };
      }

      const nextStep = createStep(
        response.step ?? response.next_step ?? null,
        response.schema ?? response.next_schema ?? null,
        response.options ?? null,
        nextContext
      );

      return {
        ...state,
        completedSteps,
        currentStep: nextStep,
        context: nextContext,
        isComplete: false,
        finalConfig: null,
        loading: false,
        error: null,
        fieldErrors: {},
      };
    }
    case "SET_ERROR":
      return {
        ...state,
        loading: false,
        error: action.error,
        fieldErrors: action.fieldErrors ?? {},
      };
    case "EXPIRE":
      return {
        ...initialState,
        error: action.error,
      };
    case "UPDATE_VALUE":
      if (!state.currentStep) return state;
      return {
        ...state,
        currentStep: {
          ...state.currentStep,
          values: { ...state.currentStep.values, [action.key]: action.value },
        },
      };
    case "SET_CREDENTIALS":
      return { ...state, credentials: action.credentials };
    case "CLEAR_CREDENTIALS":
      return { ...state, credentials: null };
    default:
      return state;
  }
};

export const useProviderWizard = (vendor: string | null) => {
  const { token } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);

  const start = useCallback(async () => {
    if (!token || !vendor) return false;
    dispatch({ type: "RESET" });
    dispatch({ type: "LOAD_START" });
    try {
      const res = await providerApi.getWizardStart(token, vendor);
      dispatch({ type: "APPLY_RESPONSE", response: res.data as WizardResponse });
      return true;
    } catch (err) {
      const parsed = parseApiError(err);
      dispatch({ type: "SET_ERROR", error: parsed.message, fieldErrors: parsed.fieldErrors });
      return false;
    }
  }, [token, vendor]);

  const submitStep = useCallback(async () => {
    if (!token || !vendor || !state.currentStep?.step) return false;
    dispatch({ type: "LOAD_START" });

    const data = coerceSchemaValues(state.currentStep.schema, state.currentStep.values);
    const payload: Record<string, any> = {
      ...data,
      context: state.context ?? {},
    };

    if (data.username || data.password) {
      dispatch({
        type: "SET_CREDENTIALS",
        credentials: {
          username: data.username ? String(data.username) : state.credentials?.username ?? "",
          password: data.password ? String(data.password) : state.credentials?.password ?? "",
        },
      });
    }

    try {
      const res = await providerApi.runWizardStep(token, vendor, state.currentStep.step, payload);
      dispatch({ type: "APPLY_RESPONSE", response: res.data as WizardResponse });
      return true;
    } catch (err) {
      if (axios.isAxiosError(err) && err.response?.status === 410) {
        dispatch({ type: "EXPIRE", error: "Session expired, restart wizard." });
        return false;
      }
      const parsed = parseApiError(err);
      dispatch({ type: "SET_ERROR", error: parsed.message, fieldErrors: parsed.fieldErrors });
      return false;
    }
  }, [token, vendor, state.currentStep, state.context, state.credentials]);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  const updateValue = useCallback((key: string, value: any) => {
    dispatch({ type: "UPDATE_VALUE", key, value });
  }, []);

  const consumeCredentials = useCallback(() => {
    const current = state.credentials;
    if (current) {
      dispatch({ type: "CLEAR_CREDENTIALS" });
    }
    return current;
  }, [state.credentials]);

  return {
    completedSteps: state.completedSteps,
    currentStep: state.currentStep,
    isComplete: state.isComplete,
    finalConfig: state.finalConfig,
    loading: state.loading,
    error: state.error,
    fieldErrors: state.fieldErrors,
    start,
    submitStep,
    reset,
    updateValue,
    consumeCredentials,
  };
};
