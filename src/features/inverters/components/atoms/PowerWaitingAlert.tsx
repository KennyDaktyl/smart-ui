import { Alert, CircularProgress } from "@mui/material";
import { useTranslation } from "react-i18next";

interface Props {
  countdown: number;
}

export function PowerWaitingAlert({ countdown }: Props) {
  const { t } = useTranslation();

  return (
    <Alert severity="info" sx={{ display: "flex", gap: 1 }}>
      <CircularProgress size={16} />
      {t("power.waiting", { seconds: countdown })}
    </Alert>
  );
}
