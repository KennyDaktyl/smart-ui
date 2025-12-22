import { Alert, Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import AddProviderCard from "@/features/providers/components/AddProviderCard";
import ProviderInstanceCard from "@/features/providers/components/ProviderInstanceCard";
import type { ProviderInstance } from "@/features/providers/types/provider";

type ApiProvidersSectionProps = {
  loading: boolean;
  error: string | null;
  providers: ProviderInstance[];
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

export default function ApiProvidersSection({
  loading,
  error,
  providers,
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
}: ApiProvidersSectionProps) {
  const { t } = useTranslation();

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
            <Typography variant="h6">{t("providers.apiSectionTitle")}</Typography>
            {loading && <Typography variant="body2">{t("common.loading")}</Typography>}
          </Stack>
          {error && <Alert severity="error">{error}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <AddProviderCard onClick={onAdd} />
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
              {t("providers.emptyApi")}
            </Typography>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}
