import { useEffect, useState } from "react";
import { providersApi } from "@/api/providersApi";
import { parseApiError, ParsedApiError } from "@/api/parseApiError";
import { ProviderTypeDefinition } from "../types/provider";

export function useProviderDefinitions() {
  const [data, setData] = useState<ProviderTypeDefinition[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ParsedApiError | null>(null);

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      try {
        const res = await providersApi.getProviderDefinitions();
        if (mounted) {
          setData(res.data.provider_types);
        }
      } catch (err) {
        if (mounted) {
          setError(parseApiError(err));
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return { data, loading, error };
}
