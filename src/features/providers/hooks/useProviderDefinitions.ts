import { useCallback, useEffect, useState } from "react";

import { providerApi } from "@/api/providerApi";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { parseApiError } from "@/utils/apiErrors";
import type { ProviderType, VendorDefinition } from "@/features/providers/types/provider";

type ProviderDefinitions = {
  provider_types: Array<{
    type: ProviderType;
    vendors: VendorDefinition[];
  }>;
};

export const useProviderDefinitions = () => {
  const { token } = useAuth();
  const [data, setData] = useState<ProviderDefinitions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError(null);
    try {
      const res = await providerApi.getProviderDefinitions(token);
      setData(res.data ?? null);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  return { data, loading, error, reload: load };
};
