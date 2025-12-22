import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, Stack, Typography } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { useTranslation } from "react-i18next";

import ProviderSchemaForm from "@/features/providers/components/ProviderSchemaForm";
import ProviderFinalizationForm from "@/features/providers/components/ProviderFinalizationForm";
import type { ProviderInstance, ProviderMetadataForm } from "@/features/providers/types/provider";

type EditProviderDialogProps = {
  open: boolean;
  provider: ProviderInstance | null;
  schema: Record<string, any> | null;
  schemaValues: Record<string, any>;
  loading: boolean;
  schemaLoading: boolean;
  schemaError: string | null;
  fieldErrors: Record<string, string>;
  metadata: ProviderMetadataForm;
  metadataErrors: Record<string, string>;
  submitError: string | null;
  onSchemaChange: (key: string, value: any) => void;
  onMetadataChange: (field: keyof ProviderMetadataForm, value: string | boolean) => void;
  onClose: () => void;
  onCancel: () => void;
  onSubmit: () => void;
};

export default function EditProviderDialog({
  open,
  provider,
  schema,
  schemaValues,
  loading,
  schemaLoading,
  schemaError,
  fieldErrors,
  metadata,
  metadataErrors,
  submitError,
  onSchemaChange,
  onMetadataChange,
  onClose,
  onCancel,
  onSubmit,
}: EditProviderDialogProps) {
  const { t } = useTranslation();

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{
        sx: {
          borderRadius: 3,
          background: "linear-gradient(180deg, #ffffff 0%, #f7faf9 100%)",
          color: "#0b1f2a",
        },
      }}
    >
      <DialogTitle>
        {t("providers.editTitle")}
        <IconButton
          aria-label={t("common.close")}
          onClick={onClose}
          sx={{ position: "absolute", right: 12, top: 12 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={2}>
          {schemaError && <Alert severity="error">{schemaError}</Alert>}
          {schema && (
            <ProviderSchemaForm
              schema={schema}
              values={schemaValues}
              errors={fieldErrors}
              loading={schemaLoading}
              onChange={onSchemaChange}
            />
          )}
          <ProviderFinalizationForm
            metadata={metadata}
            errors={metadataErrors}
            submitError={submitError}
            loading={loading}
            submitLabel={t("providers.actions.save")}
            onChange={onMetadataChange}
            onSubmit={onSubmit}
          />
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel}>{t("common.close")}</Button>
        <Button variant="contained" onClick={onSubmit} disabled={loading}>
          {t("providers.actions.save")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
