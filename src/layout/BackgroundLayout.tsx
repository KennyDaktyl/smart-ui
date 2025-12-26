import { Box } from "@mui/material";
import { ReactNode } from "react";

export default function BackgroundLayout({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        pt: { xs: 1, sm: 0 },
      }}
    >
      {children}
    </Box>
  );
}
