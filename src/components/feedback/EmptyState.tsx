import { Box, Typography } from "@mui/material";

interface EmptyStateProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({
  title,
  description,
  action,
}: EmptyStateProps) {
  return (
    <Box
      py={6}
      display="flex"
      flexDirection="column"
      alignItems="center"
      textAlign="center"
    >
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>

      {description && (
        <Typography variant="body2" color="text.secondary" mb={2}>
          {description}
        </Typography>
      )}

      {action}
    </Box>
  );
}
