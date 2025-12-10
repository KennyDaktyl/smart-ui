import { Box } from "@mui/material";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function DeviceSlotWrapper({ children }: Props) {
  return (
    <Box
      sx={{
        p: { xs: 0, sm: 1 },
        borderRadius: 2,
        color: "#0d1b2a",
      }}
    >
      {children}
    </Box>
  );
}
