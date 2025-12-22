import { Alert, Card, CardContent, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";
import Grid from "@mui/material/Grid2";

import AddProviderCard from "@/features/providers/components/AddProviderCard";
import ProviderInstanceCard from "@/features/providers/components/ProviderInstanceCard";
import type { ProviderInstance } from "@/features/providers/types/provider";

type SensorProvidersSectionProps = {
  loading: boolean;
  error: string | null;
  providers: ProviderInstance[];
  selectedMicrocontrollerUuid: string;
  onAdd: () => void;
  onDetails: (provider: ProviderInstance) => void;
  onEdit: (provider: ProviderInstance) => void;
  onCancelEdit: () => void;
  editingProviderUuid: string | null;
  confirmDeleteUuid: string | null;
  deleteDisabled?: boolean;
  onRequestDelete: (uuid: string) => void;
  onCancelDelete: () => void;
  onConfirmDelete: (provider: ProviderInstance) => void;
};

export default function SensorProvidersSection({
  loading,
  error,
  providers,
  selectedMicrocontrollerUuid,
  onAdd,
  onDetails,
  onEdit,
  onCancelEdit,
  editingProviderUuid,
  confirmDeleteUuid,
  deleteDisabled,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: SensorProvidersSectionProps) {
  const { t } = useTranslation();
  const microcontrollerMissing = !selectedMicrocontrollerUuid;

  return (
    <Card
      sx={{
        borderRadius: 2.5,
        border: "1px solid rgba(13,27,42,0.08)",
        backgroundColor: "#ffffff",
        boxShadow: "0 12px 30px rgba(8,24,36,0.08)",
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems="baseline">
            <Typography variant="h6">{t("providers.sensorSectionTitle")}</Typography>
            {loading && <Typography variant="body2">{t("common.loading")}</Typography>}
          </Stack>
          {error && <Alert severity="error">{error}</Alert>}
          {microcontrollerMissing && (
            <Typography variant="body2" color="text.secondary">
              {t("providers.notifications.selectMicrocontroller")}
            </Typography>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <AddProviderCard onClick={onAdd} disabled={microcontrollerMissing} />
            </Grid>
            {providers.map((provider) => (
              <Grid item xs={12} md={6} key={provider.uuid ?? provider.id}>
                <ProviderInstanceCard
                  provider={provider}
                  isEditing={editingProviderUuid === provider.uuid}
                  confirmingDelete={confirmDeleteUuid === provider.uuid}
                  deleteDisabled={deleteDisabled}
                  onDetails={() => onDetails(provider)}
                  onEdit={() => onEdit(provider)}
                  onCancelEdit={onCancelEdit}
                  onRequestDelete={() => {
                    if (provider.uuid) {
                      onRequestDelete(provider.uuid);
                    }
                  }}
                  onCancelDelete={onCancelDelete}
                  onConfirmDelete={() => onConfirmDelete(provider)}
                />
              </Grid>
            ))}
          </Grid>
          {!loading && providers.length === 0 && (
            <Typography variant="body2" color="text.secondary">
              {t("providers.emptySensor")}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
