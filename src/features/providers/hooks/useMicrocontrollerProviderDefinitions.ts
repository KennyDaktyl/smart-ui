import { useCallback, useEffect, useState } from "react";

import { providerApi } from "@/api/providerApi";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { parseApiError } from "@/utils/apiErrors";
import type { ProviderType, VendorDefinition } from "@/features/providers/types/provider";

export type ProviderDefinitions = {
  provider_types: Array<{
    type: ProviderType;
    vendors: VendorDefinition[];
  }>;
};

export const useMicrocontrollerProviderDefinitions = (microcontrollerUuid: string | null) => {
  const { token } = useAuth();
  const [data, setData] = useState<ProviderDefinitions | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token || !microcontrollerUuid) return;
    setLoading(true);
    setError(null);
    try {
      const res = await providerApi.getMicrocontrollerProviderDefinitions(token, microcontrollerUuid);
      setData(res.data ?? null);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed.message);
    } finally {
      setLoading(false);
    }
  }, [token, microcontrollerUuid]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
};
