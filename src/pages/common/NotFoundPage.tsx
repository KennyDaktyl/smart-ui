import { Box, Button, Stack, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { useTranslation } from "react-i18next";

export default function NotFoundPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        minHeight: "60vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Stack spacing={2} alignItems="center" textAlign="center">
        <ErrorOutlineIcon sx={{ fontSize: 72, opacity: 0.6 }} />

        <Typography variant="h3" fontWeight={800}>
          404
        </Typography>

        <Typography variant="h6" color="text.secondary">
          {t("errors.404.title")}
        </Typography>

        <Typography variant="body2" color="text.secondary">
          {t("errors.404.description")}
        </Typography>

        <Button
          variant="contained"
          onClick={() => navigate("/")}
          sx={{ mt: 2 }}
        >
          {t("errors.404.backHome")}
        </Button>
      </Stack>
    </Box>
  );
}
