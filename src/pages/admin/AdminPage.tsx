// src/pages/admin/AdminPage.tsx
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Tabs, Tab, Stack, Typography, Box } from "@mui/material";
import { useTranslation } from "react-i18next";

import { AdminPageContainer } from "@/features/admin/components/layout/AdminPageLayout";

export default function AdminPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const currentTab = location.pathname.includes("/microcontrollers")
    ? "microcontrollers"
    : "users";

  const pathSegments = location.pathname
    .split("/")
    .filter(Boolean);

  const showTabs = pathSegments.length <= 2;

  return (
    <AdminPageContainer>
      <Stack spacing={3}>
        {/* HEADER */}
        <Typography variant="h4" fontWeight={800}>
          {t("admin.title")}
        </Typography>

        {/* TABS */}
        {showTabs && (
          <Box>
            <Tabs
              value={currentTab}
              onChange={(_, value) => navigate(`/admin/${value}`)}
              aria-label="Admin navigation tabs"
            >
              <Tab
                value="users"
                label={t("admin.tabs.users")}
              />
              <Tab
                value="microcontrollers"
                label={t("admin.tabs.microcontrollers")}
              />
            </Tabs>
          </Box>
        )}

        {/* CONTENT */}
        <Outlet />
      </Stack>
    </AdminPageContainer>
  );
}
