import { Box, Grid, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

import ProviderCard from "@/features/providers/components/ProviderCard";
import type { VendorDefinition } from "@/features/providers/types/provider";

type ProviderListProps = {
  vendors: VendorDefinition[];
  selectedVendor: string | null;
  onSelect: (vendor: VendorDefinition) => void;
  onClearSelection: () => void;
};

export default function ProviderList({
  vendors,
  selectedVendor,
  onSelect,
  onClearSelection,
}: ProviderListProps) {
  const { t } = useTranslation();

  if (vendors.length === 0) {
    return (
      <Typography sx={{ color: "rgba(13,27,42,0.7)" }}>
        {t("providers.emptyForType")}
      </Typography>
    );
  }

  const visibleVendors = selectedVendor
    ? vendors.filter((vendor) => vendor.vendor === selectedVendor)
    : vendors;

  return (
    <Box>
      <Grid container spacing={2}>
        {visibleVendors.map((vendor) => (
          <Grid key={vendor.vendor} item xs={12} md={6}>
            <ProviderCard
              vendor={vendor}
              selected={vendor.vendor === selectedVendor}
              onSelect={() => onSelect(vendor)}
              onClear={selectedVendor ? onClearSelection : undefined}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}
