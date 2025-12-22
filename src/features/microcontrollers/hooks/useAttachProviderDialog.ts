import { useCallback, useMemo, useState } from "react";
import axios from "axios";
import { useTranslation } from "react-i18next";

import { microcontrollerApi } from "@/api/microcontrollerApi";
import { MANUAL_PROVIDER_OPTION, Microcontroller } from "@/features/microcontrollers/components/types";

type UseAttachProviderDialogParams = {
  token: string | null;
  pendingProviderUuid: string;
  onReload(): Promise<void> | void;
  onClearPendingProvider(): void;
};

export function useAttachProviderDialog({
  token,
  pendingProviderUuid,
  onReload,
  onClearPendingProvider,
}: UseAttachProviderDialogParams) {
  const { t } = useTranslation();

  const [open, setOpen] = useState(false);
  const [microcontroller, setMicrocontroller] = useState<Microcontroller | null>(null);

  const [selectedProviderUuid, setSelectedProviderUuid] = useState<string>(
    MANUAL_PROVIDER_OPTION
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parseError = useCallback(
    (err: unknown) => {
      if (!axios.isAxiosError(err)) return t("common.errors.generic");
      const status = err.response?.status;
      if (status === 401) return t("common.errors.sessionExpired");
      if (status === 422) return t("common.errors.invalidInput");
      if (status === 500) return t("common.errors.serverError");
      return t("common.errors.requestFailed");
    },
    [t]
  );

  const openDialog = useCallback(
    (mc: Microcontroller) => {
      setMicrocontroller(mc);
      setError(null);

      const activeUuid = mc.active_provider?.uuid ?? MANUAL_PROVIDER_OPTION;

      const available = [
        ...(mc.available_api_providers ?? []),
        ...(mc.available_sensor_providers ?? []),
      ];

      const hasPending =
        pendingProviderUuid.length > 0
          ? available.some((p) => p.uuid === pendingProviderUuid)
          : false;

      setSelectedProviderUuid(hasPending ? pendingProviderUuid : activeUuid);
      setOpen(true);
    },
    [pendingProviderUuid]
  );

  const closeDialog = useCallback(() => {
    setOpen(false);
  }, []);

  const save = useCallback(async () => {
    if (!token || !microcontroller) return;

    try {
      setSaving(true);
      setError(null);

      await microcontrollerApi.attachProvider(token, microcontroller.uuid, {
        provider_id:
          selectedProviderUuid === MANUAL_PROVIDER_OPTION ? null : selectedProviderUuid,
      });

      await onReload();
      setOpen(false);
      onClearPendingProvider();
    } catch (e) {
      setError(parseError(e));
    } finally {
      setSaving(false);
    }
  }, [
    token,
    microcontroller,
    selectedProviderUuid,
    onReload,
    onClearPendingProvider,
    parseError,
  ]);

  return useMemo(
    () => ({
      dialog: {
        open,
        microcontroller,
        selectedProviderUuid,
        saving,
        error,
      },
      actions: {
        openDialog,
        closeDialog,
        setSelectedProviderUuid,
        save,
      },
    }),
    [open, microcontroller, selectedProviderUuid, saving, error, openDialog, closeDialog, save]
  );
}
