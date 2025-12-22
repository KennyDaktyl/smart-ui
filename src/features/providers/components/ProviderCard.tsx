import { Button, Card, CardContent, Stack, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import type { VendorDefinition } from "@/features/providers/types/provider";

type ProviderCardProps = {
  vendor: VendorDefinition;
  selected: boolean;
  onSelect: () => void;
  onClear?: () => void;
};

export default function ProviderCard({ vendor, selected, onSelect, onClear }: ProviderCardProps) {
  const { t } = useTranslation();

  return (
    <Card
      sx={{
        borderRadius: 2,
        border: selected ? "2px solid rgba(15,139,111,0.7)" : "1px solid rgba(0,0,0,0.08)",
        cursor: "pointer",
        transition: "transform 0.2s ease, box-shadow 0.2s ease",
        boxShadow: selected ? "0 8px 24px rgba(15,139,111,0.15)" : "none",
        transform: selected ? "translateY(-2px)" : "none",
      }}
      onClick={onSelect}
    >
      <CardContent>
        <Stack spacing={1.2}>
          <Stack direction="row" justifyContent="space-between" alignItems="center">
            <Typography variant="subtitle1">{vendor.label}</Typography>
            {selected && onClear && (
              <Button size="small" onClick={(event) => {
                event.stopPropagation();
                onClear();
              }}>
                {t("providers.actions.changeProvider")}
              </Button>
            )}
          </Stack>
          <Typography variant="body2" sx={{ color: "rgba(13,27,42,0.7)" }}>
            {t("providers.card.vendor", { vendor: vendor.vendor })}
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(13,27,42,0.7)" }}>
            {t("providers.card.kind", { kind: vendor.kind })}
          </Typography>
          <Typography variant="body2" sx={{ color: "rgba(13,27,42,0.7)" }}>
            {t("providers.card.unit", { unit: vendor.default_unit })}
          </Typography>
          <Typography variant="caption" sx={{ color: "rgba(13,27,42,0.55)" }}>
            {vendor.requires_wizard
              ? t("providers.card.wizardRequired")
              : t("providers.card.manualSetup")}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}
