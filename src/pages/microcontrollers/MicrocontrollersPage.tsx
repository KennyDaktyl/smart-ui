import { Alert } from "@mui/material";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

import { useAuth } from "@/features/auth/hooks/useAuth";
import { useMicrocontrollers } from "@/features/providers/hooks/useMicrocontrollers";
import { useUserProviders } from "@/features/providers/hooks/useUserProviders";


import { MicrocontrollerGrid } from "@/features/microcontrollers/components/MicrocontrollerGrid";
import { AttachProviderDialog } from "@/features/microcontrollers/components/AttachProviderDialog";
import { useAttachProviderDialog } from "@/features/microcontrollers/hooks/useAttachProviderDialog";
import { CenteredLoader } from "@/layout/CenteredLoader";
import { PageHeader } from "@/layout/PageHeader";
import { EmptyState } from "@/components/feedback/EmptyState";

export default function MicrocontrollersPage() {
  const { token } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const pendingProviderUuid = searchParams.get("attachProvider") ?? "";

  const { items, loading, error, reload } = useMicrocontrollers(token);
  const { providers: userProviders, reload: reloadUserProviders } = useUserProviders();

  const attach = useAttachProviderDialog({
    token,
    pendingProviderUuid,
    onReload: async () => {
      await Promise.all([reload(), reloadUserProviders()]);
    },
    onClearPendingProvider: () => setSearchParams({}, { replace: true }),
  });

  if (loading) return <CenteredLoader />;

  return (
    <>
      <PageHeader
        title={t("microcontrollers.title")}
        subtitle={t("microcontrollers.subtitle")}
        description={t("microcontrollers.hardwareSoftwareHint")}
      />

      {error && <Alert severity="error">{error}</Alert>}

      {items.length === 0 ? (
        <EmptyState title={t("microcontrollers.empty")} />
      ) : (
      <MicrocontrollerGrid
        items={items}
        onAttachProvider={(mc) => {
          const apiProviders = userProviders
            .filter((provider) => provider.provider_type === "api" && provider.microcontroller_id == null)
            .filter(
              (provider) =>
                !(mc.available_api_providers ?? []).some((existing) => existing.uuid === provider.uuid)
            );
          attach.actions.openDialog({
            ...mc,
            available_api_providers: [...(mc.available_api_providers ?? []), ...apiProviders],
          });
        }}
        onRefresh={reload}
      />
      )}

      <AttachProviderDialog
        open={attach.dialog.open}
        microcontroller={attach.dialog.microcontroller}
        selectedProviderUuid={attach.dialog.selectedProviderUuid}
        onSelectProvider={attach.actions.setSelectedProviderUuid}
        onClose={attach.actions.closeDialog}
        onSave={attach.actions.save}
        loading={attach.dialog.saving}
        error={attach.dialog.error}
        onGoToProviders={() => navigate("/providers")}
      />

    </>
  );
}
