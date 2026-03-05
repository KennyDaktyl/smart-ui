import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Box, Tabs, Tab, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import { AdminPageContainer } from "@/features/admin/components/layout/AdminPageLayout";

export default function AdminPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const currentTab = location.pathname.includes("/microcontrollers")
    ? "microcontrollers"
    : "users";

  const showTabs = location.pathname === "/admin"
    || location.pathname === "/admin/users"
    || location.pathname === "/admin/microcontrollers";

  return (
    <AdminPageContainer>
      <Stack spacing={{ xs: 2, md: 3 }}>
        <Typography variant="h4" fontWeight={800} sx={{ color: "#e8f1f8" }}>
          {t("admin.title")}
        </Typography>

        {showTabs && (
          <Box
            sx={{
              borderBottom: "1px solid",
              borderColor: "divider",
            }}
          >
            <Tabs
              value={currentTab}
              onChange={(_, value) => navigate(`/admin/${value}`)}
              variant="scrollable"
              allowScrollButtonsMobile
              sx={{
                "& .MuiTab-root": {
                  color: "rgba(232,241,248,0.72)",
                },
                "& .MuiTab-root.Mui-selected": {
                  color: "#f7b733",
                },
                "& .MuiTabs-indicator": {
                  backgroundColor: "#f7b733",
                },
              }}
            >
              <Tab value="users" label={t("admin.tabs.users")} />
              <Tab
                value="microcontrollers"
                label={t("admin.tabs.microcontrollers")}
              />
            </Tabs>
          </Box>
        )}

        <Outlet />
      </Stack>
    </AdminPageContainer>
  );
}
