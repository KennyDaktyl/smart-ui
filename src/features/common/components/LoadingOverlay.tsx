import { Box, CircularProgress } from "@mui/material";
import { SxProps, Theme } from "@mui/material/styles";
import { ReactNode } from "react";

type LoadingOverlayProps = {
  children: ReactNode;
  loading?: boolean;
  keepChildrenMounted?: boolean;
  minHeight?: number | string;
  spinnerSize?: number;
  sx?: SxProps<Theme>;
  contentSx?: SxProps<Theme>;
};

export default function LoadingOverlay({
  children,
  loading = false,
  keepChildrenMounted = true,
  minHeight = 240,
  spinnerSize = 34,
  sx,
  contentSx,
}: LoadingOverlayProps) {
  const showChildren = !loading || keepChildrenMounted;

  return (
    <Box
      aria-busy={loading}
      sx={{
        position: "relative",
        minHeight,
        ...sx,
      }}
    >
      {showChildren && (
        <Box
          sx={{
            opacity: loading ? 0.42 : 1,
            pointerEvents: loading ? "none" : "auto",
            transition: "opacity 180ms ease",
            ...contentSx,
          }}
        >
          {children}
        </Box>
      )}

      {loading && (
        <Box
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1,
          }}
        >
          <CircularProgress size={spinnerSize} />
        </Box>
      )}
    </Box>
  );
}
