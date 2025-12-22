import { Card, CardContent, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

export default function ManualModeInfoSection() {
  const { t } = useTranslation();

  return (
    <Card
      sx={{
        borderRadius: 2.5,
        border: "1px solid rgba(13,27,42,0.08)",
        backgroundColor: "#ffffff",
        boxShadow: "0 12px 30px rgba(8,24,36,0.08)",
      }}
    >
      <CardContent>
        <Stack spacing={1.5}>
          <Typography variant="h6">{t("providers.manualSectionTitle")}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t("providers.manualSectionSubtitle")}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
