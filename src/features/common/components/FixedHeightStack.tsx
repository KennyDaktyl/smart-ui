import { Box } from "@mui/material";
import type { SxProps, Theme } from "@mui/material/styles";
import type { ReactNode } from "react";

export type FixedHeightStackProps = {
  minHeight: number | string;
  children: ReactNode;
  sx?: SxProps<Theme>;
};

export function FixedHeightStack({ minHeight, children, sx }: FixedHeightStackProps) {
  return (
    <Box
      sx={{
        minHeight,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        ...sx,
      }}
    >
      {children}
    </Box>
  );
}
