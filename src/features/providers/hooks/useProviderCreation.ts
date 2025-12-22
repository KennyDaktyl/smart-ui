import { useCallback, useState } from "react";

import { providerApi } from "@/api/providerApi";
import { useAuth } from "@/features/auth/hooks/useAuth";

export const useProviderCreation = () => {
  const { token } = useAuth();
  const [creating, setCreating] = useState(false);

  const createProvider = useCallback(
    async (
      payload: Record<string, any>,
      options?: { microcontrollerUuid?: string; providerType?: string }
    ) => {
      if (!token) {
        throw new Error("Missing authentication token.");
      }
      setCreating(true);
      try {
        if (options?.providerType === "sensor") {
          if (!options.microcontrollerUuid) {
            throw new Error("Missing microcontroller UUID.");
          }
          const res = await providerApi.createMicrocontrollerProvider(
            token,
            options.microcontrollerUuid,
            payload
          );
          return res.data;
        } else {
          const res = await providerApi.createUserProvider(token, payload);
          return res.data;
        }
      } finally {
        setCreating(false);
      }
    },
    [token]
  );

  return { createProvider, creating };
};
