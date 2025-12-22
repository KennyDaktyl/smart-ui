import { useCallback, useState } from "react";

import { providerApi } from "@/api/providerApi";
import { useAuth } from "@/features/auth/hooks/useAuth";

export const useProviderUpdate = () => {
  const { token } = useAuth();
  const [saving, setSaving] = useState(false);

  const updateProvider = useCallback(
    async (providerUuid: string, payload: Record<string, any>) => {
      if (!token) {
        throw new Error("Missing authentication token.");
      }
      setSaving(true);
      try {
        await providerApi.updateProvider(token, providerUuid, payload);
      } finally {
        setSaving(false);
      }
    },
    [token]
  );

  return { updateProvider, saving };
};
