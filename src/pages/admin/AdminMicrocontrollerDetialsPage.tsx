import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Button,
  Tabs,
  Tab,
  Chip,
  Stack,
  CircularProgress,
  Alert,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import { useTranslation } from "react-i18next";

import { adminApi } from "@/api/adminApi";
import { MicrocontrollerResponse } from "@/features/microcontrollers/types/microcontroller";
import { MicrocontrollerDetails } from "@/features/microcontrollers/components/admin/MicrocontrollerDetails";
import { AdminMicrocontrollerFormModal } from "@/features/microcontrollers/components/admin/AdminMicrocontrollerFormModal";
import { MicrocontrollerActionsTab } from "@/features/admin/tabs/MicrocontrollerActionsTab";
import { MicrocontrollerConfigurationTab } from "@/features/admin/tabs/MicrocontrollerConfigurationTab";
import { AdminPageHeader } from "@/features/admin/components/layout/AdminPageLayout";
import SurfacePanel from "@/layout/SurfacePanel";
import { PageShell } from "@/features/admin/components/layout/PageShell";
import { MicrocontrollerLiveStatus } from "@/features/microcontrollers/live/MicrocontrollerLiveStatus";

type TabKey = "details" | "configuration" | "actions";

export default function AdminMicrocontrollerDetailsPage() {
  const { t } = useTranslation();
  const { microcontrollerId } = useParams<{ microcontrollerId: string }>();
  const navigate = useNavigate();

  const [mc, setMc] = useState<MicrocontrollerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>("details");

  const id = Number(microcontrollerId);

  useEffect(() => {
    if (!microcontrollerId || Number.isNaN(id)) {
      navigate("/admin/microcontrollers", { replace: true });
      return;
    }

    setLoading(true);
    adminApi
      .getMicrocontroller(id)
      .then((res) => setMc(res.data))
      .finally(() => setLoading(false));
  }, [id, microcontrollerId, navigate]);

  if (!mc && !loading) return null;

  return (
    <MicrocontrollerLiveStatus uuid={mc?.uuid}>
      {(live) => {
        const canSendCommands = live.status === "online";

        const header = (
          <AdminPageHeader
            title={
              <Stack direction="row" spacing={2} alignItems="center">
                <span>{mc?.name ?? t("admin.microcontrollers.title")}</span>

                {mc && (
                  <>
                    {live.status === "pending" && (
                      <CircularProgress size={16} />
                    )}

                    {live.status === "online" && (
                      <Chip size="small" label="ONLINE" color="success" />
                    )}

                    {live.status === "offline" && (
                      <Chip size="small" label="OFFLINE" variant="outlined" />
                    )}
                  </>
                )}
              </Stack>
            }
            breadcrumbs={[
              { label: t("admin.title"), to: "/admin" },
              { label: t("admin.tabs.microcontrollers"), to: "/admin/microcontrollers" },
              { label: t("common.details") },
            ]}
            startAction={
              <Button
                startIcon={<ArrowBackIcon />}
                onClick={() => navigate("/admin/microcontrollers")}
              >
                {t("common.backToList")}
              </Button>
            }
            endActions={
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                onClick={() => setEditOpen(true)}
              >
                {t("common.edit")}
              </Button>
            }
          />
        );

        const tabs = (
          <SurfacePanel sx={{ mt: 2, px: 0, py: 0 }}>
            <Tabs
              value={tab}
              onChange={(_, value) => setTab(value)}
              variant="scrollable"
              allowScrollButtonsMobile
            >
              <Tab value="details" label={t("common.details")} />

              <Tab
                value="configuration"
                label={t("common.configuration")}
                disabled={!canSendCommands}
              />

              <Tab
                value="actions"
                label={t("common.actions")}
                disabled={!canSendCommands}
              />
            </Tabs>
          </SurfacePanel>
        );

        return (
          <>
            <PageShell header={header} tabs={tabs} loading={loading}>
              {mc && (
                <>
                  {tab === "details" && (
                    <MicrocontrollerDetails
                      microcontroller={mc}
                      isAdmin
                      onDelete={async () => {
                        await adminApi.deleteMicrocontroller(mc.id);
                        navigate("/admin/microcontrollers");
                      }}
                    />
                  )}

                  {tab === "configuration" && (
                    canSendCommands ? (
                      <MicrocontrollerConfigurationTab
                        microcontroller={mc}
                        disabled={!canSendCommands}
                      />
                    ) : (
                      <OfflineGuard />
                    )
                  )}

                  {tab === "actions" && (
                    canSendCommands ? (
                      <MicrocontrollerActionsTab
                        microcontroller={mc}
                        disabled={!canSendCommands}
                      />
                    ) : (
                      <OfflineGuard />
                    )
                  )}
                </>
              )}
            </PageShell>

            <AdminMicrocontrollerFormModal
              open={editOpen}
              microcontroller={mc ?? undefined}
              onClose={() => setEditOpen(false)}
              onSuccess={async () => {
                setEditOpen(false);
                if (mc) {
                  const res = await adminApi.getMicrocontroller(mc.id);
                  setMc(res.data);
                }
              }}
            />
          </>
        );
      }}
    </MicrocontrollerLiveStatus>
  );
}

function OfflineGuard() {
  const { t } = useTranslation();

  return (
    <Alert severity="warning">
      {t("microcontroller.offlineWarning")}
    </Alert>
  );
}
