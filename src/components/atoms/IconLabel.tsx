import { Box, type SxProps, type Theme } from "@mui/material";
import type { ReactNode } from "react";

type IconLabelProps = {
  icon: ReactNode;
  children: ReactNode;
  sx?: SxProps<Theme>;
};

export default function IconLabel({
  icon,
  children,
  sx,
}: IconLabelProps) {
  return (
    <Box
      component="span"
      sx={{
        display: "inline-flex",
        alignItems: "center",
        gap: 0.75,
        lineHeight: 1.2,
        verticalAlign: "middle",
        "& svg": {
          fontSize: "1.1em",
        },
        ...sx,
      }}
    >
      <Box
        component="span"
        sx={{ display: "inline-flex", alignItems: "center", color: "inherit" }}
      >
        {icon}
      </Box>
      <Box component="span">{children}</Box>
    </Box>
  );
}
