import { Paper, Stack, Alert } from "@mui/material";
import { ReactNode } from "react";

interface FormCardProps {
  children: ReactNode;
  successMessage?: string;
  errorMessage?: string;
  maxWidth?: number;
}

export default function FormCard({
  children,
  successMessage,
  errorMessage,
  maxWidth = 560,
}: FormCardProps) {
  return (
    <Paper
      sx={{
        p: 3,
        maxWidth,
        backgroundColor: "#EEF2F4",
        borderRadius: 3,
      }}
    >
      <Stack spacing={2.5}>
        {successMessage && (
          <Alert severity="success">{successMessage}</Alert>
        )}
        {errorMessage && (
          <Alert severity="error">{errorMessage}</Alert>
        )}
        {children}
      </Stack>
    </Paper>
  );
}
