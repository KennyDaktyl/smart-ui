import { useCallback, useState } from "react";

import { providerApi } from "@/api/providerApi";
import { useAuth } from "@/features/auth/hooks/useAuth";

export const useProviderDelete = () => {
  const { token } = useAuth();
  const [removing, setRemoving] = useState(false);

  const deleteProvider = useCallback(
    async (providerUuid: string) => {
      if (!token) {
        throw new Error("Missing authentication token.");
      }
      setRemoving(true);
      try {
        await providerApi.deleteProvider(token, providerUuid);
      } finally {
        setRemoving(false);
      }
    },
    [token]
  );

  return { deleteProvider, removing };
};
