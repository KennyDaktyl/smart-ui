import { useState, useCallback } from "react";
import { useToast } from "@/context/ToastContext";
import { providersApi } from "@/api/providersApi";

export function useToggleProviderEnabled(
  uuid: string,
  onSuccess: (enabled: boolean) => void
) {
  const { notifyError } = useToast();
  const [loading, setLoading] = useState(false);

  const toggle = useCallback(
    async (next: boolean) => {
      setLoading(true);
      try {
        await providersApi.setProviderEnabled(uuid, next);
        onSuccess(next);
      } catch {
        notifyError("Failed to update provider status");
      } finally {
        setLoading(false);
      }
    },
    [uuid, notifyError, onSuccess]
  );

  return { loading, toggle };
}

