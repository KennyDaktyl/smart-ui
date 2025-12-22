import { useCallback, useEffect, useReducer } from "react";

import { microcontrollerApi } from "@/api/microcontrollerApi";
import { parseApiError } from "@/utils/apiErrors";
import { Microcontroller } from "@/features/microcontrollers/components/types";

/* =========================
   State & Actions
========================= */

type MicrocontrollerState = {
  items: Microcontroller[];
  loading: boolean;
  error: string | null;
};

type MicrocontrollerAction =
  | { type: "LOAD_START" }
  | { type: "LOAD_SUCCESS"; items: Microcontroller[] }
  | { type: "LOAD_ERROR"; error: string };

const initialState: MicrocontrollerState = {
  items: [],
  loading: true,
  error: null,
};

/* =========================
   Reducer
========================= */

function reducer(
  state: MicrocontrollerState,
  action: MicrocontrollerAction
): MicrocontrollerState {
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
}

/* =========================
   Hook
========================= */

export function useMicrocontrollers(token: string | null) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const load = useCallback(async () => {
    if (!token) return;

    dispatch({ type: "LOAD_START" });

    try {
      const res = await microcontrollerApi.getMicrocontrollers(token);

      /**
       * Backend może zwracać:
       * - { microcontrollers: [...] }
       * - [...]
       */
      const data = res.data?.microcontrollers ?? res.data ?? [];

      dispatch({
        type: "LOAD_SUCCESS",
        items: Array.isArray(data) ? data : [],
      });
    } catch (err) {
      const parsed = parseApiError(err);
      dispatch({ type: "LOAD_ERROR", error: parsed.message });
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return {
    items: state.items,
    loading: state.loading,
    error: state.error,
    reload: load,
  };
}
