import { Paper, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

interface Props {
  email: string;
  role: string;
  createdAt: string;
}

export default function AccountHeader({ email, role, createdAt }: Props) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "pl" ? "pl-PL" : "en-US";

  return (
    <Paper sx={{ p: 3 }}>
      <Stack spacing={0.5}>
        <Typography variant="body1">
          <strong>{t("account.email")}</strong> {email}
        </Typography>
        <Typography variant="body1">
          <strong>{t("account.role")}</strong> {role}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {t("account.createdAt")}{" "}
          {new Date(createdAt).toLocaleDateString(locale)}
        </Typography>
      </Stack>
    </Paper>
  );
}
