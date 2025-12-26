import { useState } from "react";
import { useTranslation } from "react-i18next";

import { adminApi } from "@/api/adminApi";
import { parseApiError } from "@/api/parseApiError";
import { useToast } from "@/context/ToastContext";
import {
  CreateMicrocontrollerPayload,
  EditMicrocontrollerPayload,
} from "../types/microcontrollerPayload";

type Mode = "create" | "edit";

export function useMicrocontrollerMutation(
  mode: Mode,
  microcontrollerId: number | undefined,
  onSuccess: () => void
) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { t } = useTranslation();
  const { notifyError, notifySuccess } = useToast();

  const submit = async (
    data: CreateMicrocontrollerPayload | EditMicrocontrollerPayload
  ) => {
    try {
      setLoading(true);
      setError(null);

      if (mode === "create") {
        await adminApi.createMicrocontroller(
          data as CreateMicrocontrollerPayload
        );
      } else {
        if (!microcontrollerId) {
          throw new Error("Missing microcontrollerId for edit");
        }

        await adminApi.updateMicrocontroller(
          microcontrollerId,
          data as EditMicrocontrollerPayload
        );
      }

      const successKey =
        mode === "create"
          ? "microcontroller.notifications.createSuccess"
          : "microcontroller.notifications.updateSuccess";

      notifySuccess(t(successKey));

      onSuccess();
    } catch (e: any) {
      const parsed = parseApiError(e);
      setError(parsed.message);
      notifyError(t("errors.api.generic"));
      throw e;
    } finally {
      setLoading(false);
    }
  };

  return {
    submit,
    loading,
    error,
  };
}
