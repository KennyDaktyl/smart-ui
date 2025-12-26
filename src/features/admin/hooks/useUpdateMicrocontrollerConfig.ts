// features/microcontrollers/hooks/useUpdateMicrocontrollerConfig.ts
import { useState } from "react";
import { adminApi } from "@/api/adminApi";
import { parseApiError } from "@/api/parseApiError";
import { useToast } from "@/context/ToastContext";
import { UpdateMicrocontrollerConfigPayload } from "@/features/microcontrollers/types/microcontrollerPayload";

export function useUpdateMicrocontrollerConfig(
  microcontrollerId: number
) {
  const { notifySuccess, notifyError } = useToast();
  const [loading, setLoading] = useState(false);

  const save = async (payload: UpdateMicrocontrollerConfigPayload) => {
    try {
      setLoading(true);

      await adminApi.updateMicrocontrollerConfig(
        microcontrollerId,
        payload
      );

      notifySuccess("common.savedSuccessfully");
    } catch (error) {
      const parsed = parseApiError(error);
      notifyError(parsed.message);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    save,
    loading,
  };
}
