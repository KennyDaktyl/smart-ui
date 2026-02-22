import { useEffect, useState } from "react";
import { providersApi } from "@/api/providersApi";
import type { ProviderResponse } from "@/features/providers/types/userProvider";

type UseProviderDetailsOptions = {
  providerUuid?: string;
  initialProvider?: ProviderResponse | null;
};

export function useProviderDetails({
  providerUuid,
  initialProvider = null,
}: UseProviderDetailsOptions) {
  const [provider, setProvider] = useState<ProviderResponse | null>(
    initialProvider
  );
  const [loading, setLoading] = useState(
    Boolean(providerUuid) && !initialProvider
  );

  useEffect(() => {
    if (!providerUuid) {
      setProvider(null);
      setLoading(false);
      return;
    }

    if (provider?.uuid === providerUuid) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    const loadProvider = async () => {
      setLoading(true);
      try {
        const res = await providersApi.getProviderByUuid(providerUuid);
        if (!cancelled) {
          setProvider(res.data);
        }
      } catch {
        if (!cancelled) {
          setProvider(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadProvider();

    return () => {
      cancelled = true;
    };
  }, [provider?.uuid, providerUuid]);

  return {
    provider,
    loading,
  };
}
