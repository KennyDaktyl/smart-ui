import { Box } from "@mui/material";
import { ReactNode } from "react";

interface Props {
  children: ReactNode;
}

export function DeviceSlotWrapper({ children }: Props) {
  return (
    <Box
      sx={{
        border: "1px solid #e0e0e0",
        borderRadius: 2,
        p: 2,
      }}
    >
      {children}
    </Box>
  );
}
