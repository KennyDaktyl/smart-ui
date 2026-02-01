import { Box, Typography } from "@mui/material";

type DeviceInfoTileProps = {
  label: string;
  value: string;
};

export function DeviceInfoTile({ label, value }: DeviceInfoTileProps) {
  return (
    <Box
      sx={{
        borderRadius: 2,
        border: "1px solid rgba(15,139,111,0.18)",
        background: "#ffffff",
        p: 1.5,
        minHeight: 72,
      }}
    >
      <Typography variant="caption" sx={{ color: "#475569" }}>
        {label}
      </Typography>
      <Typography variant="subtitle1" fontWeight={600} sx={{ color: "#0f172a" }}>
        {value}
      </Typography>
    </Box>
  );
}
