import { Stack, Typography, CircularProgress } from "@mui/material";
import CircleIcon from "@mui/icons-material/Circle";
import { useTranslation } from "react-i18next";

interface StatusIndicatorProps {
  loading: boolean;
  isOnline: boolean;
}

export function StatusIndicator({ loading, isOnline }: StatusIndicatorProps) {
  const { t } = useTranslation();

  if (loading) {
    return (
      <Stack direction="row" spacing={1} alignItems="center">
        <CircularProgress size={12} />
        <Typography variant="body2" color="text.secondary">
          {t("common.waitingForStatus")}
        </Typography>
      </Stack>
    );
  }

  return (
    <Stack direction="row" spacing={1} alignItems="center">
      <CircleIcon
        sx={{
          color: isOnline ? "success.main" : "grey.500",
          fontSize: 14,
        }}
      />
      <Typography variant="body2" color="text.secondary">
        {isOnline ? t("common.online") : t("common.offline")}
      </Typography>
    </Stack>
  );
}
