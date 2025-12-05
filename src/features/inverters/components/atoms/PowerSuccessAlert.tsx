import { Alert, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

interface Props {
  power: number;
  timestamp?: string | null;
  countdown: number;
}

export function PowerSuccessAlert({ power, timestamp, countdown }: Props) {
  const { t } = useTranslation();

  return (
    <Alert
      severity="success"
      sx={{
        bgcolor: "#e8f7ef",
        color: "#0d1b2a",
        backdropFilter: "none",
        boxShadow: "0 10px 20px rgba(0,0,0,0.12)",
      }}
    >
      ⚡ {t("power.value", { power: power.toFixed(2) })}

      <Typography variant="body2">
        {t("power.nextUpdate", { seconds: countdown })}
      </Typography>

      {timestamp && (
        <Typography variant="body2">
          {t("power.lastUpdate", { timestamp })}
        </Typography>
      )}
    </Alert>
  );
}
