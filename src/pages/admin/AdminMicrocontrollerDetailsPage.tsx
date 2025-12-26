import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Button,
  CircularProgress,
  Tabs,
  Tab,
} from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EditIcon from "@mui/icons-material/Edit";
import { useTranslation } from "react-i18next";

import { adminApi } from "@/api/adminApi";
import { MicrocontrollerResponse } from "@/features/microcontrollers/types/microcontroller";
import { MicrocontrollerDetails } from "@/features/microcontrollers/components/MicrocontrollerDetails";
import { MicrocontrollerFormModal } from "@/features/admin/components/MicrocontrollerFormModal";
import { MicrocontrollerActionsTab } from "@/features/admin/tabs/MicrocontrollerActionsTab";
import { MicrocontrollerConfigurationTab } from "@/features/admin/tabs/MicrocontrollerConfigurationTab";
import { AdminPageHeader } from "@/features/admin/components/layout/AdminPageLayout";
import SurfacePanel from "@/layout/SurfacePanel";

type TabKey = "details" | "configuration" | "actions";

export default function AdminMicrocontrollerDetailsPage() {
  const { t } = useTranslation();
  const { microcontrollerId } = useParams<{ microcontrollerId: string }>();
  const navigate = useNavigate();

  const [mc, setMc] = useState<MicrocontrollerResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [editOpen, setEditOpen] = useState(false);
  const [tab, setTab] = useState<TabKey>("details");

  useEffect(() => {
    if (!microcontrollerId || Number.isNaN(Number(microcontrollerId))) {
      navigate("/admin/microcontrollers", { replace: true });
      return;
    }

    setLoading(true);
    adminApi
      .getMicrocontroller(Number(microcontrollerId))
      .then((res) => setMc(res.data))
      .finally(() => setLoading(false));
  }, [microcontrollerId, navigate]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={8}>
        <CircularProgress />
      </Box>
    );
  }

  if (!mc) return null;

  return (
    <>
      <AdminPageHeader
        title={mc.name}
        breadcrumbs={[
          { label: t("admin.title"), to: "/admin" },
          {
            label: t("admin.tabs.microcontrollers"),
            to: "/admin/microcontrollers",
          },
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

      <SurfacePanel
        sx={{
          mt: 2,
          px: 0,
          py: 0,
          backgroundColor: "rgba(255,255,255,0.9)",
        }}
      >
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          variant="scrollable"
          allowScrollButtonsMobile
          sx={{
            minHeight: 48,
            borderBottom: "1px solid",
            borderColor: "divider",

            "& .MuiTab-root": {
              textTransform: "none",
              fontWeight: 600,
              minHeight: 48,
              color: "text.secondary",
            },

            "& .MuiTab-root.Mui-selected": {
              color: "primary.main",
            },

            "& .MuiTabs-indicator": {
              backgroundColor: "primary.main",
              height: 2,
            },
          }}
        >

          <Tab value="details" label={t("common.details")} />
          <Tab value="configuration" label={t("microcontroller.configuration")} />
          <Tab value="actions" label={t("common.actions")} />
        </Tabs>
      </SurfacePanel>

      <SurfacePanel sx={{ mt: 2 }}>
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
          <MicrocontrollerConfigurationTab microcontroller={mc} />
        )}

        {tab === "actions" && (
          <MicrocontrollerActionsTab microcontroller={mc} />
        )}
      </SurfacePanel>

      {/* EDIT MODAL */}
      <MicrocontrollerFormModal
        open={editOpen}
        microcontroller={mc}
        onClose={() => setEditOpen(false)}
        onSuccess={async () => {
          setEditOpen(false);
          const res = await adminApi.getMicrocontroller(mc.id);
          setMc(res.data);
        }}
      />
    </>
  );
}
