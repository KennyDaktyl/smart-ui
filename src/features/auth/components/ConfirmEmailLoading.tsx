import { Box, CircularProgress, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

export default function ConfirmEmailLoading() {
  const { t } = useTranslation();

  return (
    <Box textAlign="center" py={8}>
      <CircularProgress />
      <Typography mt={2}>
        {t("auth.confirmEmail.loadingTitle")}
      </Typography>
    </Box>
  );
}
