import { Box, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import ConfirmEmailContainer from "@/features/auth/components/ConfirmEmailContainer";

export default function ConfirmEmailPage() {
  const { t } = useTranslation();

  return (
    <Stack spacing={3} sx={{ width: "100%", maxWidth: 520, mx: "auto" }}>
      <Box>
        <Typography variant="h4" sx={{ fontWeight: 800, mb: 1 }}>
          {t("auth.confirmEmail.title")}
        </Typography>
        <Typography variant="body2" color="rgba(232,241,248,0.8)">
          {t("auth.confirmEmail.subtitle")}
        </Typography>
      </Box>

      <Box
        sx={{
          p: 3,
          borderRadius: 3,
          background: "linear-gradient(145deg, rgba(255,255,255,0.96) 0%, #f3fbf7 100%)",
          boxShadow: "0 18px 40px rgba(0,0,0,0.24)",
          color: "#0d1b2a",
        }}
      >
        <ConfirmEmailContainer />
      </Box>
    </Stack>
  );
}
