import {
  Box,
  Typography,
  Stack,
  Paper,
} from "@mui/material";
import { ProviderDefinitionVendor } from "../../types/provider";
import { useTranslation } from "react-i18next";

type Props = {
  vendors: ProviderDefinitionVendor[];
  selectedVendor?: ProviderDefinitionVendor;
  onSelect: (vendor: ProviderDefinitionVendor) => void;
};

export default function SelectProviderStep({
  vendors,
  selectedVendor,
  onSelect,
}: Props) {
  const { t } = useTranslation();

  return (
    <Box>
      <Typography variant="h6" mb={2}>
        {t("providers.wizard.selectVendor")}
      </Typography>

      <Stack direction="row" flexWrap="wrap" gap={2}>
        {vendors.map((vendor) => {
          const isSelected =
            selectedVendor?.vendor === vendor.vendor;

          return (
            <Paper
              key={vendor.vendor}
              onClick={() => onSelect(vendor)}
              variant="outlined"
              sx={{
                p: 2,
                width: 240,
                cursor: "pointer",
                borderColor: isSelected
                  ? "primary.main"
                  : "divider",
                bgcolor: isSelected
                  ? "primary.light"
                  : "background.paper",
              }}
            >
              <Typography variant="subtitle1">
                {vendor.label}
              </Typography>

            <Typography
              variant="caption"
              color="text.secondary"
            >
              {t("providers.wizard.vendorMeta", {
                kind: vendor.kind,
                unit: vendor.default_unit,
              })}
            </Typography>
          </Paper>
        );
        })}
      </Stack>
    </Box>
  );
}
