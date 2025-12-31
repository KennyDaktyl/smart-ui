import { Box, Button, Stack, Divider, Typography, CardContent } from "@mui/material";
import { useTranslation } from "react-i18next";
import { MicrocontrollerResponse } from "@/features/microcontrollers/types/microcontroller";

type Props = {
  microcontroller: MicrocontrollerResponse;
  disabled?: boolean;
};

export function MicrocontrollerActionsTab({
  microcontroller,
  disabled = false,
}: Props) {
  const { t } = useTranslation();

  return (
    <CardContent>
      <Typography variant="subtitle1" fontWeight={600}>
        {t("microcontroller.actions.title")}
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Stack spacing={2} width="100%">
        <Button
          variant="outlined"
          color="warning"
          fullWidth
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
            console.log("RESTART", microcontroller.uuid);
          }}
        >
          {t("microcontroller.actions.restart")}
        </Button>

        <Button
          variant="contained"
          color="success"
          fullWidth
          disabled={disabled}
          onClick={() => {
            if (disabled) return;
            console.log("UPDATE", microcontroller.uuid);
          }}
        >
          {t("microcontroller.actions.update")}
        </Button>
      </Stack>
    </CardContent>
  );
}
