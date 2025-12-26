import { Box, CircularProgress } from "@mui/material";

interface CenteredSpinnerProps {
  fullscreen?: boolean;
  overlay?: boolean;
}

export default function CenteredSpinner({
  fullscreen = false,
  overlay = false,
}: CenteredSpinnerProps) {
  return (
    <Box
      sx={{
        position: fullscreen ? "fixed" : "relative",
        inset: fullscreen ? 0 : undefined,
        // minHeight: fullscreen ? "100vh" : "40vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: overlay ? "rgba(255,255,255,0.75)" : "transparent",
        zIndex: overlay ? 1200 : "auto",
      }}
    >
      <CircularProgress />
    </Box>
  );
}
