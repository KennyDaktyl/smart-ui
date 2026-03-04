import {
  Alert,
  Button,
  CardContent,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { useState } from "react";
import { useTranslation } from "react-i18next";

import { adminApi } from "@/api/adminApi";
import { parseApiError } from "@/api/parseApiError";
import { StickyDialog } from "@/components/dialogs/StickyDialog";
import { useToast } from "@/context/ToastContext";
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
  const { notifyError, notifySuccess } = useToast();

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleReboot = async () => {
    if (disabled) return;

    try {
      setLoading(true);
      setError(null);
      await adminApi.rebootMicrocontrollerAgent(microcontroller.id);
      notifySuccess(t("microcontroller.actions.restartSuccess"));
      setConfirmOpen(false);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed.message);
      notifyError(parsed.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <CardContent>
      <Typography variant="subtitle1" fontWeight={600}>
        {t("microcontroller.actions.title")}
      </Typography>

      <Divider sx={{ my: 2 }} />

      <Stack spacing={2} width="100%">
        <Typography variant="body2" color="text.secondary">
          {t("microcontroller.actions.restartHint")}
        </Typography>

        {error && <Alert severity="error">{error}</Alert>}

        <Button
          variant="outlined"
          color="warning"
          fullWidth
          disabled={disabled || loading}
          onClick={() => setConfirmOpen(true)}
        >
          {t("microcontroller.actions.restart")}
        </Button>
      </Stack>

      <StickyDialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title={t("microcontroller.actions.restartConfirmTitle")}
        actions={
          <>
            <Button onClick={() => setConfirmOpen(false)} disabled={loading}>
              {t("common.cancel")}
            </Button>
            <Button
              color="warning"
              onClick={handleReboot}
              disabled={loading || disabled}
              autoFocus
            >
              {t("common.confirm")}
            </Button>
          </>
        }
        maxWidth="xs"
      >
        {t("microcontroller.actions.restartConfirmMessage")}
      </StickyDialog>
    </CardContent>
  );
}
