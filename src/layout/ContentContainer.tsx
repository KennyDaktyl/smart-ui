import { Box } from "@mui/material";
import { ReactNode } from "react";
import { SxProps, Theme } from "@mui/material/styles";

interface ContentContainerProps {
  children: ReactNode;
  sx?: SxProps<Theme>;
}

export default function ContentContainer({ children, sx }: ContentContainerProps) {
  return (
    <Box component="section" sx={{ width: "100%", ...sx }}>
      <Box
        sx={{
          maxWidth: 1320,
          mx: "auto",
          pt: { xs: 4, sm: 5, md: 4 },
          px: { xs: 2, sm: 3, md: 4 },
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
