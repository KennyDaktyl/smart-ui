import { useCallback, useEffect, useReducer } from "react";

import { providerApi } from "@/api/providerApi";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { parseApiError } from "@/utils/apiErrors";
import { buildInitialFormData } from "@/features/providers/utils/schemaUtils";

type SchemaState = {
  schema: Record<string, any> | null;
  loading: boolean;
  error: string | null;
  values: Record<string, any>;
  fieldErrors: Record<string, string>;
};

type SchemaAction =
  | { type: "RESET" }
  | { type: "LOAD_START" }
  | { type: "LOAD_SUCCESS"; schema: Record<string, any> | null }
  | { type: "LOAD_ERROR"; error: string }
  | { type: "SET_VALUES"; values: Record<string, any> }
  | { type: "SET_VALUE"; key: string; value: any }
  | { type: "SET_FIELD_ERRORS"; errors: Record<string, string> };

const initialState: SchemaState = {
  schema: null,
  loading: false,
  error: null,
  values: {},
  fieldErrors: {},
};

const reducer = (state: SchemaState, action: SchemaAction): SchemaState => {
  switch (action.type) {
    case "RESET":
      return initialState;
    case "LOAD_START":
      return { ...state, loading: true, error: null, fieldErrors: {} };
    case "LOAD_SUCCESS": {
      const values = buildInitialFormData(action.schema, state.values);
      return {
        ...state,
        schema: action.schema,
        loading: false,
        error: null,
        fieldErrors: {},
        values,
      };
    }
    case "LOAD_ERROR":
      return { ...state, loading: false, error: action.error };
    case "SET_VALUES":
      return { ...state, values: action.values };
    case "SET_VALUE":
      return { ...state, values: { ...state.values, [action.key]: action.value } };
    case "SET_FIELD_ERRORS":
      return { ...state, fieldErrors: action.errors };
    default:
      return state;
  }
};

export const useProviderSchema = (vendor: string | null) => {
  const { token } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);

  const loadSchema = useCallback(async () => {
    if (!token || !vendor) return;
    dispatch({ type: "LOAD_START" });
    try {
      const res = await providerApi.getProviderDefinitionDetails(token, vendor);
      const schema = (res.data?.config_schema ?? null) as Record<string, any> | null;
      dispatch({ type: "LOAD_SUCCESS", schema });
    } catch (err) {
      const parsed = parseApiError(err);
      dispatch({ type: "LOAD_ERROR", error: parsed.message });
    }
  }, [token, vendor]);

  useEffect(() => {
    if (!vendor) {
      dispatch({ type: "RESET" });
      return;
    }
    loadSchema();
  }, [vendor, loadSchema]);

  const setValue = useCallback((key: string, value: any) => {
    dispatch({ type: "SET_VALUE", key, value });
    if (state.fieldErrors[key]) {
      dispatch({ type: "SET_FIELD_ERRORS", errors: { ...state.fieldErrors, [key]: "" } });
    }
  }, [state.fieldErrors]);

  const setValues = useCallback((values: Record<string, any>) => {
    dispatch({ type: "SET_VALUES", values });
  }, []);

  const setFieldErrors = useCallback((errors: Record<string, string>) => {
    dispatch({ type: "SET_FIELD_ERRORS", errors });
  }, []);

  const reset = useCallback(() => {
    dispatch({ type: "RESET" });
  }, []);

  return {
    schema: state.schema,
    loading: state.loading,
    error: state.error,
    values: state.values,
    fieldErrors: state.fieldErrors,
    setValue,
    setValues,
    setFieldErrors,
    reset,
    reload: loadSchema,
  };
};
