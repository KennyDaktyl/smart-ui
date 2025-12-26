import { useCallback } from "react";
import { useTranslation } from "react-i18next";

import { adminApi } from "@/api/adminApi";
import { useToast } from "@/context/ToastContext";

export function useMicrocontrollerDeletion() {
  const { notifyError, notifySuccess } = useToast();
  const { t } = useTranslation();

  const remove = useCallback(
    async (microcontrollerId: number) => {
      try {
        await adminApi.deleteMicrocontroller(microcontrollerId);
        notifySuccess(t("microcontroller.notifications.deleteSuccess"));
      } catch (err) {
        notifyError(t("errors.api.generic"));
        throw err;
      }
    },
    [notifyError, notifySuccess, t]
  );

  return { remove };
}
