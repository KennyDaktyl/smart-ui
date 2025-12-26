import { Box, Button, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

export default function ConfirmEmailSuccess() {
  const { t } = useTranslation();

  return (
    <Box textAlign="center" py={8}>
      <Typography variant="h5" gutterBottom>
        {t("auth.confirmEmail.successTitle")}
      </Typography>

      <Typography mb={4}>
        {t("auth.confirmEmail.successDescription")}
      </Typography>

      <Button
        component={RouterLink}
        to="/login"
        variant="contained"
        size="large"
      >
        {t("auth.confirmEmail.goToLogin")}
      </Button>
    </Box>
  );
}
