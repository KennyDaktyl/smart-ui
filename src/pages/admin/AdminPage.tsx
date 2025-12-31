// // src/pages/admin/AdminPage.tsx
// import { Outlet } from "react-router-dom";
// import { AdminPageContainer } from "@/features/admin/components/layout/AdminPageLayout";

// export default function AdminPage() {
//   return (
//     <AdminPageContainer>
//       <Outlet />
//     </AdminPageContainer>
//   );
// }

// src/pages/admin/AdminPage.tsx
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Tabs, Tab, Stack, Typography } from "@mui/material";
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
      <Stack spacing={3}>
        <Typography variant="h4" fontWeight={800}>
          {t("admin.title")}
        </Typography>

        {showTabs && (
          <Tabs
            value={currentTab}
            onChange={(_, value) => navigate(`/admin/${value}`)}
          >
            <Tab value="users" label={t("admin.tabs.users")} />
            <Tab
              value="microcontrollers"
              label={t("admin.tabs.microcontrollers")}
            />
          </Tabs>
        )}

        <Outlet />
      </Stack>
    </AdminPageContainer>
  );
}
