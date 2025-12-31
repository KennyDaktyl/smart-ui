import { useState } from "react";
import { providersWizardApi } from "@/api/providersWizardApi";
import { parseApiError, ParsedApiError } from "@/api/parseApiError";
import { WizardResponse } from "../types/wizard";

export function useProviderWizard(vendor: string | null) {
  const [data, setData] = useState<WizardResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<ParsedApiError | null>(null);

  const start = async () => {
    if (!vendor) return;
    setLoading(true);
    try {
      const res = await providersWizardApi.startWizard(vendor);
      setData(res.data);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  const submitStep = async (
    step: string,
    payload: Record<string, any>
  ) => {
    if (!vendor) return;
    setLoading(true);
    try {
      const res = await providersWizardApi.submitStep(vendor, {
        step,
        payload,
      });
      setData(res.data);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return {
    data,
    loading,
    error,
    start,
    submitStep,
  };
}
