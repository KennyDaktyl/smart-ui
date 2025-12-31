import { useEffect, useState, useCallback } from "react";
import { ProviderResponse } from "../types/userProvider";
import { parseApiError, ParsedApiError } from "@/api/parseApiError";
import { providersApi } from "@/api/providersApi";

export function useProviders() {
  const [data, setData] = useState<ProviderResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ParsedApiError | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await providersApi.getProviders();
      setData(res.data);
    } catch (err) {
      setError(parseApiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    if (mounted) {
      load();
    }

    return () => {
      mounted = false;
    };
  }, [load]);

  return {
    data,
    loading,
    error,
    reload: load, 
  };
}
