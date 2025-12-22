import { Box, CircularProgress } from "@mui/material";

interface CenteredLoaderProps {
  minHeight?: number | string;
}

export function CenteredLoader({ minHeight = "60vh" }: CenteredLoaderProps) {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      minHeight={minHeight}
    >
      <CircularProgress />
    </Box>
  );
}
