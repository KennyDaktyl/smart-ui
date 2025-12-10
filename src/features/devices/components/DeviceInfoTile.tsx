import { Paper, Typography } from "@mui/material";

interface DeviceInfoTileProps {
  label: string;
  value: string;
}

export function DeviceInfoTile({ label, value }: DeviceInfoTileProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 1.5,
        borderRadius: 2,
        borderColor: "rgba(15,139,111,0.14)",
        background: "linear-gradient(135deg, #ffffff 0%, #f6fbf8 100%)",
        height: "100%",
      }}
    >
      <Typography variant="caption" sx={{ color: "#64748b" }}>
        {label}
      </Typography>
      <Typography variant="body1" fontWeight={600} sx={{ color: "#0f172a" }}>
        {value}
      </Typography>
    </Paper>
  );
}
