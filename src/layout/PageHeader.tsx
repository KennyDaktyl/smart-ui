import { Stack, Typography } from "@mui/material";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  description?: string;
}

export function PageHeader({
  title,
  subtitle,
  description,
}: PageHeaderProps) {
  return (
    <Stack spacing={1} mb={3} mt={2}>
      <Typography variant="h4" fontWeight={700}>
        {title}
      </Typography>

      {subtitle && (
        <Typography variant="body1" color="text.secondary">
          {subtitle}
        </Typography>
      )}

      {description && (
        <Typography variant="body2" color="text.secondary" maxWidth={560}>
          {description}
        </Typography>
      )}
    </Stack>
  );
}
