import { Box, Chip } from "@mui/material";
import { keyframes } from "@mui/system";

export type LiveIndicatorProps = {
  active: boolean;
};

const pulse = keyframes`
  0% { opacity: 0.4; transform: scale(0.9); }
  50% { opacity: 1; transform: scale(1); }
  100% { opacity: 0.4; transform: scale(0.9); }
`;

export function LiveIndicator({ active }: LiveIndicatorProps) {
  return (
    <Box display="inline-flex" alignItems="center" gap={1}>
      {active && (
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            bgcolor: "success.main",
            animation: `${pulse} 1.2s ease-in-out infinite`,
          }}
        />
      )}
      <Chip
        size="small"
        label="LIVE"
        color={active ? "success" : "default"}
        variant={active ? "outlined" : "outlined"}
      />
    </Box>
  );
}
