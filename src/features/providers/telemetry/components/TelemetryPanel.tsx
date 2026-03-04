import { Box, type SxProps, type Theme, Typography } from "@mui/material";
import type { ReactNode } from "react";

type TelemetryPanelProps = {
  title: string;
  providerName: string;
  children: ReactNode;
  contentSx?: SxProps<Theme>;
};

export function TelemetryPanel({
  title,
  providerName,
  children,
  contentSx,
}: TelemetryPanelProps) {
  return (
    <Box
      sx={{
        borderRadius: 3,
        background: "linear-gradient(145deg, #0b1828 0%, #0f8b6f 120%)",
        color: "#e2f2ec",
        boxShadow: "0 24px 48px rgba(0,0,0,0.35)",
        overflow: "hidden",
      }}
    >
      <Box sx={{ p: { xs: 2, md: 3 } }}>
        <Typography variant="overline" sx={{ opacity: 0.8 }}>
          {title}
        </Typography>
        <Typography variant="h5" fontWeight={700}>
          {providerName}
        </Typography>
      </Box>

      <Box
        sx={{
          background: "#f6fbf8",
          p: { xs: 2, md: 3 },
          ...contentSx,
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
