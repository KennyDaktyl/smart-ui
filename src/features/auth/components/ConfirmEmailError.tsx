import { Box, Button, Stack, Typography } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

type Props = {
  message?: string | null;
};

export default function ConfirmEmailError({ message }: Props) {
  const { t } = useTranslation();

  return (
    <Box textAlign="center" py={8}>
      <Typography variant="h5" gutterBottom>
        {t("auth.confirmEmail.errorTitle")}
      </Typography>

      <Typography mb={4}>
        {message ?? t("auth.confirmEmail.errorDescription")}
      </Typography>

      <Stack direction="row" spacing={1} justifyContent="center">
        <Button
          component={RouterLink}
          to="/activate-account"
          variant="contained"
        >
          {t("auth.confirmEmail.goToActivation")}
        </Button>
        <Button
          component={RouterLink}
          to="/register"
          variant="outlined"
        >
          {t("auth.confirmEmail.goToRegister")}
        </Button>
      </Stack>
    </Box>
  );
}
