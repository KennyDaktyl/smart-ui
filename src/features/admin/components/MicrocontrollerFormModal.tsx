import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
} from "@mui/material";
import { useTranslation } from "react-i18next";

import { MicrocontrollerForm } from "./MicrocontrollerForm";
import { MicrocontrollerResponse } from "@/features/microcontrollers/types/microcontroller";
import { useMicrocontrollerMutation } from "@/features/microcontrollers/hooks/useMicrocontrollerMutation";
import SurfacePanel from "@/layout/SurfacePanel";

type Props = {
  open: boolean;
  onClose: () => void;
  microcontroller?: MicrocontrollerResponse;
  onSuccess: () => void;
};

export function MicrocontrollerFormModal({
  open,
  onClose,
  microcontroller,
  onSuccess,
}: Props) {
  const { t } = useTranslation();

  const mode = microcontroller ? "edit" : "create";

  const {
    submit,
    loading,
    error,
  } = useMicrocontrollerMutation(
    mode,
    microcontroller?.id,
    onSuccess
  );

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {microcontroller
          ? t("microcontroller.form.editTitle")
          : t("microcontroller.form.addTitle")}
      </DialogTitle>

      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        <SurfacePanel sx={{ p: 2, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
          <MicrocontrollerForm
            isEdit={!!microcontroller}
            defaultValues={
              microcontroller
                ? {
                    user_id: microcontroller.user?.id ?? undefined,
                    name: microcontroller.name,
                    description: microcontroller.description ?? "",
                    software_version: microcontroller.software_version ?? "",
                    type: microcontroller.type,
                    max_devices: microcontroller.max_devices,
                    assigned_sensors: microcontroller.assigned_sensors ?? [],
                    enabled: microcontroller.enabled,
                  }
                : undefined
            }
            onSubmit={submit}
          />
        </SurfacePanel>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          {t("common.cancel")}
        </Button>

        <Button
          type="submit"
          form="microcontroller-form"
          variant="contained"
          disabled={loading}
        >
          {t("common.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
