import { Box, Button, Stack, Divider, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import { MicrocontrollerResponse } from "@/features/microcontrollers/types/microcontroller";

type Props = {
  microcontroller: MicrocontrollerResponse;
};

export function MicrocontrollerActionsTab({ microcontroller }: Props) {
  const { t } = useTranslation();

  return (
    <Box
      sx={{
        width: "100%",
        background: "rgba(255,255,255,0.9)",
        borderRadius: 2,
        border: "1px solid rgba(16, 185, 129, 0.2)",
        p: { xs: 2, md: 3 },
        color: "text.primary",
      }}
    >
      <Typography
        variant="subtitle1"
        fontWeight={600}
        sx={{ color: "text.primary" }}
      >
        {t("microcontroller.actions.title")}
      </Typography>

      <Divider sx={{ my: 2, borderColor: "divider" }} />

      <Stack spacing={2} width="100%">
        <Button
          variant="outlined"
          color="warning"
          fullWidth
          sx={{
            borderWidth: 2,
            borderColor: "rgba(249, 115, 22, 0.6)",
          }}
          onClick={() => {
            console.log("RESTART", microcontroller.uuid);
          }}
        >
          {t("microcontroller.actions.restart")}
        </Button>

        <Button
          variant="contained"
          color="success"
          fullWidth
          onClick={() => {
            console.log("UPDATE", microcontroller.uuid);
          }}
        >
          {t("microcontroller.actions.update")}
        </Button>
      </Stack>
    </Box>
  );
}
