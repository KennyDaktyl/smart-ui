import { useCallback, useEffect, useReducer } from "react";

import { providerApi } from "@/api/providerApi";
import { useAuth } from "@/features/auth/hooks/useAuth";
import type { ProviderInstance } from "@/features/providers/types/provider";
import { parseApiError } from "@/utils/apiErrors";

type ProviderState = {
  items: ProviderInstance[];
  loading: boolean;
  error: string | null;
};

type ProviderAction =
  | { type: "LOAD_START" }
  | { type: "LOAD_SUCCESS"; items: ProviderInstance[] }
  | { type: "LOAD_ERROR"; error: string };

const initialState: ProviderState = {
  items: [],
  loading: false,
  error: null,
};

const reducer = (state: ProviderState, action: ProviderAction): ProviderState => {
  switch (action.type) {
    case "LOAD_START":
      return { ...state, loading: true, error: null };
    case "LOAD_SUCCESS":
      return { ...state, loading: false, items: action.items };
    case "LOAD_ERROR":
      return { ...state, loading: false, error: action.error };
    default:
      return state;
  }
};

const normalizeProviders = (data: any): ProviderInstance[] => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  if (Array.isArray(data.providers)) return data.providers;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

export const useMicrocontrollerProviders = (microcontrollerUuid: string | null) => {
  const { token } = useAuth();
  const [state, dispatch] = useReducer(reducer, initialState);

  const load = useCallback(async () => {
    if (!token || !microcontrollerUuid) return;
    dispatch({ type: "LOAD_START" });
    try {
      const res = await providerApi.getMicrocontrollerProviders(token, microcontrollerUuid);
      const items = normalizeProviders(res.data);
      dispatch({ type: "LOAD_SUCCESS", items });
    } catch (err) {
      const parsed = parseApiError(err);
      dispatch({ type: "LOAD_ERROR", error: parsed.message });
    }
  }, [token, microcontrollerUuid]);

  useEffect(() => {
    if (!microcontrollerUuid) return;
    load();
  }, [load, microcontrollerUuid]);

  return {
    providers: state.items,
    loading: state.loading,
    error: state.error,
    reload: load,
  };
};
