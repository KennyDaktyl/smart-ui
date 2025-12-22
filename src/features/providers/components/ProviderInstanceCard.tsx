import { Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import type { ProviderInstance } from "@/features/providers/types/provider";

type ProviderInstanceCardProps = {
  provider: ProviderInstance;
  isEditing: boolean;
  confirmingDelete: boolean;
  deleteDisabled?: boolean;
  onDetails: () => void;
  onEdit: () => void;
  onCancelEdit: () => void;
  onRequestDelete: () => void;
  onCancelDelete: () => void;
  onConfirmDelete: () => void;
};

const formatValue = (value: unknown) => {
  if (value === null || value === undefined || value === "") return "-";
  return String(value);
};

export default function ProviderInstanceCard({
  provider,
  isEditing,
  confirmingDelete,
  deleteDisabled,
  onDetails,
  onEdit,
  onCancelEdit,
  onRequestDelete,
  onCancelDelete,
  onConfirmDelete,
}: ProviderInstanceCardProps) {
  const { t } = useTranslation();

  return (
    <Card
      sx={{
        borderRadius: 2.5,
        border: "1px solid rgba(8,24,36,0.1)",
        backgroundColor: "#ffffff",
        boxShadow: "0 10px 24px rgba(8,24,36,0.08)",
      }}
    >
      <CardContent>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
            <Typography variant="subtitle1" sx={{ color: "#0b1f2a" }}>
              {provider.name ?? t("providers.unknownProvider")}
            </Typography>
            {provider.provider_type && (
              <Chip
                size="small"
                label={provider.provider_type.toUpperCase()}
                sx={{ backgroundColor: "rgba(15,139,111,0.14)", color: "#0b1f2a" }}
              />
            )}
            {provider.vendor && (
              <Chip
                size="small"
                variant="outlined"
                label={provider.vendor}
                sx={{ borderColor: "rgba(8,24,36,0.25)", color: "#0b1f2a" }}
              />
            )}
            {provider.enabled === false && (
              <Chip
                size="small"
                color="warning"
                label={t("providers.status.disabled")}
                sx={{ color: "#5a3b00" }}
              />
            )}
          </Stack>

          <Typography variant="body2" sx={{ color: "rgba(11,31,42,0.8)" }}>
            {t("providers.card.kindUnit", {
              kind: formatValue(provider.kind),
              unit: formatValue(provider.unit),
            })}
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(11,31,42,0.8)" }}>
            {t("providers.card.range", {
              min: formatValue(provider.value_min),
              max: formatValue(provider.value_max),
            })}
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(11,31,42,0.8)" }}>
            {t("providers.card.lastValue", { value: formatValue(provider.last_value) })}
          </Typography>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
            <Button
              size="small"
              variant="outlined"
              onClick={onDetails}
              sx={{ borderColor: "rgba(15,139,111,0.6)", color: "#0b1f2a" }}
            >
              {t("providers.actions.details")}
            </Button>
            {isEditing ? (
              <Button size="small" onClick={onCancelEdit} sx={{ color: "#0b1f2a" }}>
                {t("providers.actions.cancelEdit")}
              </Button>
            ) : (
              <Button size="small" onClick={onEdit} sx={{ color: "#0b1f2a" }}>
                {t("providers.actions.edit")}
              </Button>
            )}
            {confirmingDelete ? (
              <Stack direction="row" spacing={1} alignItems="center">
                <Button
                  size="small"
                  color="error"
                  variant="contained"
                  onClick={onConfirmDelete}
                  disabled={deleteDisabled}
                >
                  {t("providers.actions.confirmDelete")}
                </Button>
                <Button size="small" onClick={onCancelDelete} sx={{ color: "#0b1f2a" }}>
                  {t("providers.actions.cancel")}
                </Button>
              </Stack>
            ) : (
              <Button
                size="small"
                color="error"
                onClick={onRequestDelete}
                disabled={deleteDisabled}
              >
                {t("providers.actions.delete")}
              </Button>
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}
