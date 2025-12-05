import { Stack, Typography } from "@mui/material";

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
}

export function InfoRow({ icon, label }: InfoRowProps) {
  return (
    <Stack direction="row" spacing={1} alignItems="center">
      {icon}
      <Typography variant="body2">{label}</Typography>
    </Stack>
  );
}
