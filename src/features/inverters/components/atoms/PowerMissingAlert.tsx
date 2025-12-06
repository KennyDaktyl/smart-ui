import { Alert, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

interface Props {
  timestamp?: string | null;
}

export function PowerMissingAlert({ timestamp }: Props) {
  const { t } = useTranslation();

  return (
    <Alert
      severity="error"
      sx={{
        bgcolor: "#ffeaea",
        color: "#4a0000",
        boxShadow: "0 10px 20px rgba(0,0,0,0.12)",
      }}
    >
      ❌ {t("power.missing")}
      {timestamp && (
        <Typography variant="body2">
          {t("power.lastKnown", { timestamp })}
        </Typography>
      )}
    </Alert>
  );
}
