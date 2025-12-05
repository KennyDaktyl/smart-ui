import { Alert, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

interface Props {
  timestamp?: string | null;
}

export function PowerStaleAlert({ timestamp }: Props) {
  const { t } = useTranslation();

  return (
    <Alert severity="warning">
      ⚠️ {t("power.stale")}
      {timestamp && (
        <Typography variant="body2">
          {t("power.lastKnown", { timestamp })}
        </Typography>
      )}
    </Alert>
  );
}
