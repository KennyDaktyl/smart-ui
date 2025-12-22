import { Box, CircularProgress, Stack, Typography } from "@mui/material";

import SchemaForm from "@/features/providers/components/SchemaForm";

type ProviderSchemaFormProps = {
  title?: string;
  schema: Record<string, any> | null;
  values: Record<string, any>;
  errors?: Record<string, string>;
  options?: Record<string, any> | null;
  loading?: boolean;
  disabled?: boolean;
  onChange: (key: string, value: any) => void;
};

export default function ProviderSchemaForm({
  title,
  schema,
  values,
  errors,
  options,
  loading,
  disabled,
  onChange,
}: ProviderSchemaFormProps) {
  return (
    <Stack spacing={2}>
      {title && <Typography variant="h6">{title}</Typography>}
      {loading ? (
        <Box display="flex" justifyContent="center" py={3}>
          <CircularProgress />
        </Box>
      ) : (
        <SchemaForm
          schema={schema}
          options={options ?? undefined}
          values={values}
          errors={errors}
          disabled={disabled}
          onChange={onChange}
        />
      )}
    </Stack>
  );
}
