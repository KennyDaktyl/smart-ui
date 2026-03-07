import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Box, Button, Stack, Typography } from "@mui/material";
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
            <Stack
              direction="row"
              spacing={1}
              sx={{
                alignItems: "stretch",
              }}
            >
              <AdminTopTabButton
                active={currentTab === "users"}
                label={t("admin.tabs.users")}
                onClick={() => navigate("/admin/users")}
              />
              <AdminTopTabButton
                active={currentTab === "microcontrollers"}
                label={t("admin.tabs.microcontrollers")}
                onClick={() => navigate("/admin/microcontrollers")}
              />
            </Stack>
          </Box>
        )}

        <Outlet />
      </Stack>
    </AdminPageContainer>
  );
}

function AdminTopTabButton({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      onClick={onClick}
      variant="text"
      disableElevation
      sx={{
        cursor: "pointer",
        borderRadius: 0,
        px: 0.5,
        py: 1.25,
        minWidth: 0,
        minHeight: 44,
        color: active ? "#f7b733" : "rgba(232,241,248,0.72)",
        borderBottom: "2px solid",
        borderColor: active ? "#f7b733" : "transparent",
        fontWeight: active ? 700 : 600,
        "&:hover": {
          backgroundColor: "transparent",
          color: active ? "#f7b733" : "#e8f1f8",
          borderBottomColor: active ? "#f7b733" : "rgba(232,241,248,0.45)",
        },
      }}
    >
      {label}
    </Button>
  );
}
