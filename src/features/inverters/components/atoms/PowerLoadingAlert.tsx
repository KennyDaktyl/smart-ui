import { Alert, CircularProgress } from "@mui/material";
import { useTranslation } from "react-i18next";

export function PowerLoadingAlert() {
  const { t } = useTranslation();

  return (
    <Alert severity="info" sx={{ display: "flex", gap: 1 }}>
      <CircularProgress size={16} /> {t("power.loading")}
    </Alert>
  );
}
