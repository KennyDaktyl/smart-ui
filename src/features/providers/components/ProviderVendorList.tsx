import {
  Stack,
  Paper,
  Typography,
  Box,
} from "@mui/material";
import { ProviderDefinitionVendor } from "../types/provider";

type Props = {
  vendors: ProviderDefinitionVendor[];
  selected?: string;
  onSelect: (vendor: ProviderDefinitionVendor) => void;
};

export default function ProviderVendorList({
  vendors,
  selected,
  onSelect,
}: Props) {
  return (
    <Stack spacing={2} mt={2}>
      {vendors.map((v) => {
        const isSelected = selected === v.vendor;

        return (
          <Paper
            key={v.vendor}
            variant="outlined"
            sx={{
              p: 2,
              cursor: "pointer",
              borderColor: isSelected ? "primary.main" : undefined,
              bgcolor: isSelected ? "action.selected" : undefined,
            }}
            onClick={() => onSelect(v)}
          >
            <Box>
              <Typography variant="h6">
                {v.label}
              </Typography>
              <Typography color="text.secondary">
                {v.kind} • {v.default_unit}
              </Typography>

              {v.requires_wizard && (
                <Typography
                  variant="caption"
                  color="primary"
                >
                  Wizard required
                </Typography>
              )}
            </Box>
          </Paper>
        );
      })}
    </Stack>
  );
}
