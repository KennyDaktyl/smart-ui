import { Box, Typography, Paper } from "@mui/material";
import { useAuth } from "@/features/auth/hooks/useAuth";
import { useTranslation } from "react-i18next";

export default function AccountPage() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();

  const locale = i18n.language === "pl" ? "pl-PL" : "en-US";

  return (
    <Box p={3}>
      <Typography variant="h4" mb={3}>
        {t("account.title")}
      </Typography>

      {user ? (
        <Paper sx={{ p: 3, maxWidth: 400 }}>
          <Typography variant="body1">
            <strong>{t("account.email")}</strong> {user.email}
          </Typography>
          <Typography variant="body1">
            <strong>{t("account.role")}</strong> {user.role}
          </Typography>
          <Typography variant="body1">
            <strong>{t("account.huawei")}</strong>{" "}
            {user.huawei_username ? user.huawei_username : t("account.noHuawei")}
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={2}>
            {t("account.createdAt")}{" "}
            {new Date(user.created_at).toLocaleDateString(locale)}
          </Typography>
        </Paper>
      ) : (
        <Typography color="text.secondary">
          {t("account.missingUser")}
        </Typography>
      )}
    </Box>
  );
}
