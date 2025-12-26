import { Box, Button, Stack, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

import UserResetPasswordForm from "@/features/auth/components/UserResetPasswordForm";

export default function ResetPasswordPage() {
  const { t } = useTranslation();

  return (
    <Stack spacing={3} sx={{ width: "100%", maxWidth: 520, mx: "auto" }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 800 }}>
            {t("auth.reset.title")}
          </Typography>
          <Typography variant="body2" color="rgba(232,241,248,0.8)">
            {t("auth.reset.subtitle")}
          </Typography>
        </Box>
        <Button
          component={Link}
          to="/"
          startIcon={<ArrowBackIcon />}
          variant="text"
          color="secondary"
          sx={{ borderRadius: 10, textTransform: "none" }}
        >
          {t("common.back")}
        </Button>
      </Stack>

      <Box
        sx={{
          p: 3,
          borderRadius: 3,
          background: "linear-gradient(145deg, rgba(255,255,255,0.96) 0%, #f3fbf7 100%)",
          boxShadow: "0 18px 40px rgba(0,0,0,0.24)",
          color: "#0d1b2a",
        }}
      >
        <UserResetPasswordForm />
      </Box>

      <Typography
        component={Link}
        to="/"
        sx={{
          alignSelf: "flex-start",
          color: "rgba(232,241,248,0.8)",
          textDecoration: "none",
          fontWeight: 600,
          "&:hover": { color: "#7cffe0" },
        }}
      >
        {t("common.backToHome")}
      </Typography>
    </Stack>
  );
}
