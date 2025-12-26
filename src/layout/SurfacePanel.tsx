import { Box } from "@mui/material";
import { SxProps, Theme } from "@mui/material/styles";
import { ReactNode } from "react";

interface SurfacePanelProps {
  children: ReactNode;
  sx?: SxProps<Theme>;
}

export default function SurfacePanel({ children, sx }: SurfacePanelProps) {
  return (
    <Box
      sx={{
        backgroundColor: "background.paper",
        color: "text.primary",
        borderRadius: 3,
        boxShadow: "0 18px 40px rgba(7,17,31,0.18)",
        border: "1px solid rgba(15,139,111,0.15)",
        p: { xs: 3, md: 4 },
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
