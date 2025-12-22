import { FormControl, FormControlLabel, InputLabel, MenuItem, Select, Stack, Switch, TextField, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

type SchemaField = {
  key: string;
  schema: any;
  required: boolean;
};

type OptionItem = {
  value: string;
  label: string;
};

type SchemaFormProps = {
  schema: any;
  options?: Record<string, OptionItem[]>;
  values: Record<string, any>;
  errors?: Record<string, string>;
  disabled?: boolean;
  onChange: (key: string, value: any) => void;
};

const resolveSchemaRef = (schema: any, fieldSchema: any) => {
  const ref = fieldSchema?.$ref;
  if (!ref || typeof ref !== "string") return fieldSchema;
  if (!ref.startsWith("#/")) return fieldSchema;
  const path = ref.replace(/^#\//, "").split("/");
  let current: any = schema;
  for (const segment of path) {
    if (current && typeof current === "object" && segment in current) {
      current = current[segment];
    } else {
      return fieldSchema;
    }
  }
  return current ?? fieldSchema;
};

const resolveEnum = (fieldSchema: any) => {
  if (Array.isArray(fieldSchema?.enum)) {
    return fieldSchema.enum;
  }
  if (Array.isArray(fieldSchema?.anyOf)) {
    for (const entry of fieldSchema.anyOf) {
      if (Array.isArray(entry?.enum)) {
        return entry.enum;
      }
    }
  }
  return [];
};

const normalizeOptions = (options: Record<string, any> | undefined) => {
  if (!options || typeof options !== "object") return {};
  const normalized: Record<string, OptionItem[]> = {};
  Object.entries(options).forEach(([field, value]) => {
    if (Array.isArray(value)) {
      normalized[field] = value
        .map((item) => {
          if (typeof item === "string" || typeof item === "number") {
            return { value: String(item), label: String(item) };
          }
          if (item && typeof item === "object") {
            const optionLabelBase = item.label ?? item.name;
            const optionValue =
              item.value ?? item.id ?? item.key ?? item.name ?? optionLabelBase;
            if (optionValue != null) {
              const valueLabel = String(optionValue);
              const label =
                optionLabelBase != null
                  ? `${String(optionLabelBase)} (${valueLabel})`
                  : valueLabel;
              return { value: valueLabel, label };
            }
          }
          return null;
        })
        .filter(Boolean) as OptionItem[];
    }
  });
  return normalized;
};

const resolveOptionKey = (field: string, options: Record<string, OptionItem[]>) => {
  if (options[field]) return field;
  if (options[`${field}s`]) return `${field}s`;
  if (field.endsWith("_code")) {
    const base = field.replace(/_code$/, "");
    if (options[`${base}s`]) return `${base}s`;
  }
  if (field.endsWith("_id")) {
    const base = field.replace(/_id$/, "");
    if (options[`${base}s`]) return `${base}s`;
  }
  return null;
};

export default function SchemaForm({
  schema,
  options,
  values,
  errors,
  disabled,
  onChange,
}: SchemaFormProps) {
  const { t } = useTranslation();

  if (!schema?.properties) {
    return (
      <Typography variant="body2" sx={{ color: "rgba(13,27,42,0.7)" }}>
        {t("providers.schema.empty")}
      </Typography>
    );
  }

  const requiredFields = new Set<string>(schema.required ?? []);
  const fields: SchemaField[] = Object.entries(schema.properties).map(([key, fieldSchema]) => ({
    key,
    schema: fieldSchema,
    required: requiredFields.has(key),
  }));

  const normalizedOptions = normalizeOptions(options);

  return (
    <Stack spacing={2}>
      {fields.map(({ key, schema: fieldSchema, required }) => {
        const resolvedSchema = resolveSchemaRef(schema, fieldSchema);
        const label = resolvedSchema?.title ?? fieldSchema?.title ?? key;
        const description = resolvedSchema?.description ?? fieldSchema?.description;
        const fieldError = errors?.[key];
        const isBoolean = resolvedSchema?.type === "boolean" || fieldSchema?.type === "boolean";
        const isPassword =
          resolvedSchema?.format === "password" || key.toLowerCase().includes("password");
        const optionKey = resolveOptionKey(key, normalizedOptions);
        const enumOptions = resolveEnum(resolvedSchema);
        const selectOptions =
          (optionKey ? normalizedOptions[optionKey] : undefined) ??
          (enumOptions.length > 0
            ? enumOptions.map((value: string | number) => ({
                value: String(value),
                label: String(value),
              }))
            : []);
        const isSelect = selectOptions.length > 0;

        if (isBoolean) {
          return (
            <FormControlLabel
              key={key}
              control={
                <Switch
                  checked={Boolean(values[key])}
                  onChange={(event) => onChange(key, event.target.checked)}
                  disabled={disabled}
                />
              }
              label={label}
            />
          );
        }

        if (isSelect) {
          return (
            <FormControl key={key} fullWidth required={required} error={!!fieldError}>
              <InputLabel>{label}</InputLabel>
              <Select
                label={label}
                value={values[key] ?? ""}
                onChange={(event) => onChange(key, event.target.value)}
                disabled={disabled}
              >
                {selectOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
              {fieldError && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5 }}>
                  {fieldError}
                </Typography>
              )}
              {description && (
                <Typography variant="caption" sx={{ color: "rgba(13,27,42,0.7)" }}>
                  {description}
                </Typography>
              )}
            </FormControl>
          );
        }

        return (
          <TextField
            key={key}
            label={label}
            type={
              isPassword
                ? "password"
                : resolvedSchema?.type === "number" ||
                  resolvedSchema?.type === "integer" ||
                  fieldSchema?.type === "number" ||
                  fieldSchema?.type === "integer"
                ? "number"
                : "text"
            }
            value={values[key] ?? ""}
            onChange={(event) => onChange(key, event.target.value)}
            fullWidth
            required={required}
            disabled={disabled}
            error={!!fieldError}
            helperText={fieldError || description}
            FormHelperTextProps={{ sx: { color: fieldError ? "error.main" : "rgba(13,27,42,0.7)" } }}
          />
        );
      })}
    </Stack>
  );
}
