import { ElementType, ReactNode } from "react";
import { Box, Stack, Typography } from "@mui/material";

type MetaBadgeRowProps = {
  caption: ReactNode;
  badgeLabel: ReactNode;
  IconComponent: ElementType;
};

/**
 * Reusable header row with left caption and right pill badge + icon.
 */
export function MetaBadgeRow({ caption, badgeLabel, IconComponent }: MetaBadgeRowProps) {
  return (
    <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" rowGap={0.75}>
      <Typography
        variant="caption"
        sx={{
          color: "rgba(226,242,236,0.75)",
          letterSpacing: 0.5,
          display: "inline-flex",
          alignItems: "center",
          minHeight: 24,
        }}
      >
        {caption}
      </Typography>

      <Box
        sx={{
          display: "inline-flex",
          alignItems: "center",
          gap: 0.65,
          px: 1.1,
          py: 0.5,
          borderRadius: 16,
          border: "1px solid rgba(226,242,236,0.28)",
          background: "rgba(15,139,111,0.12)",
          color: "#e8f5ef",
          textTransform: "uppercase",
          letterSpacing: 0.8,
          fontSize: 11,
          fontWeight: 700,
          boxShadow: "0 8px 22px rgba(0,0,0,0.18)",
        }}
      >
        <IconComponent sx={{ fontSize: 14, color: "rgba(226,242,236,0.85)" }} />
        <Box component="span" sx={{ lineHeight: 1 }}>
          {badgeLabel}
        </Box>
      </Box>
    </Stack>
  );
}
