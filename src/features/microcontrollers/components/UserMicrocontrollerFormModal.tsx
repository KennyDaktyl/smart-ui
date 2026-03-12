import { useState } from "react";
import { Alert, Button } from "@mui/material";
import { useTranslation } from "react-i18next";

import { StickyDialog } from "@/components/dialogs/StickyDialog";
import SurfacePanel from "@/layout/SurfacePanel";
import { microcontrollersApi } from "@/api/microcontrollerApi";
import { parseApiError } from "@/api/parseApiError";
import { useToast } from "@/context/ToastContext";
import { MicrocontrollerResponse } from "@/features/microcontrollers/types/microcontroller";
import { EditMicrocontrollerPayload } from "@/features/microcontrollers/types/microcontrollerPayload";
import { AdminMicrocontrollerForm } from "@/features/microcontrollers/components/admin/AdminMicrocontrollerForm";

type Props = {
  open: boolean;
  onClose: () => void;
  microcontroller: MicrocontrollerResponse;
  onSuccess: (microcontroller: MicrocontrollerResponse) => void;
};

export function UserMicrocontrollerFormModal({
  open,
  onClose,
  microcontroller,
  onSuccess,
}: Props) {
  const { t } = useTranslation();
  const { notifyError, notifySuccess } = useToast();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: EditMicrocontrollerPayload) => {
    setLoading(true);
    setError(null);

    try {
      const response = await microcontrollersApi.updateMicrocontroller(
        microcontroller.uuid,
        {
          name: data.name,
          description: data.description,
          software_version: data.software_version,
          assigned_sensors: data.assigned_sensors ?? [],
        }
      );

      notifySuccess(t("microcontroller.notifications.updateSuccess"));
      onSuccess(response.data);
    } catch (err) {
      const parsed = parseApiError(err);
      setError(parsed.message);
      notifyError(parsed.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <StickyDialog
      open={open}
      onClose={loading ? undefined : onClose}
      maxWidth="sm"
      title={t("microcontroller.form.editTitle")}
      actions={
        <>
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
        </>
      }
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <SurfacePanel sx={{ p: 2, boxShadow: "0 10px 30px rgba(0,0,0,0.1)" }}>
        <AdminMicrocontrollerForm
          isEdit
          includeUserField={false}
          showMaxDevicesField={false}
          showEnabledField={false}
          defaultValues={{
            name: microcontroller.name,
            description: microcontroller.description ?? "",
            software_version: microcontroller.software_version ?? "",
            assigned_sensors: microcontroller.assigned_sensors ?? [],
          }}
          onSubmit={handleSubmit}
        />
      </SurfacePanel>
    </StickyDialog>
  );
}
