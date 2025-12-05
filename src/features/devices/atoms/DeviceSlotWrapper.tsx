import { Box } from "@mui/material";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function DeviceSlotWrapper({ children }: Props) {
  return (
    <Box
      sx={{
        border: "1px solid rgba(15,139,111,0.18)",
        borderRadius: 2,
        p: 2,
        bgcolor: "rgba(255,255,255,0.92)",
        boxShadow: "0 12px 26px rgba(0,0,0,0.12)",
        color: "#0d1b2a",
      }}
    >
      {children}
    </Box>
  );
}
