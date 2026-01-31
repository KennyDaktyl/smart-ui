// LivePowerEmpty.tsx
import { Box, Stack, Typography } from "@mui/material";
import BoltIcon from "@mui/icons-material/Bolt";
import { useTranslation } from "react-i18next";

export default function LivePowerEmpty() {
  const { t } = useTranslation();

  return (
    <Box width="100%">
      <Stack direction="row" spacing={1} alignItems="center">
        <BoltIcon color="disabled" />

        <Typography variant="body2" color="text.secondary">
          {t("providers.live.noData")}
        </Typography>
      </Stack>

      <Box sx={{ height: 24 }} />
    </Box>
  );
}
