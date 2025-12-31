import {
  Box,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
} from "@mui/material";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

type WizardSchemaFormProps = {
  schema: any;
  options?: Record<string, any[]>;
  context?: Record<string, any>;
  loading: boolean;
  onSubmit: (values: Record<string, any>) => void;
  fieldErrors?: Record<string, string>;
};

/**
 * Only TECHNICAL values allowed from context
 * (NEVER credentials)
 */
const CONTEXT_PREFILL_WHITELIST = [
  "station_code",
  "device_id",
  "powerstation_id",
  "max_power_w"
];

export default function WizardSchemaForm({
  schema,
  options = {},
  context = {},
  onSubmit,
  loading,
  fieldErrors = {},
}: WizardSchemaFormProps) {
  const { t } = useTranslation();
  const [values, setValues] = useState<Record<string, any>>({});

  useEffect(() => {
    const initial: Record<string, any> = {}

    for (const [key, value] of Object.entries(options ?? {})) {
      if (value !== undefined) {
        initial[key] = value
      }
    }

    for (const key of CONTEXT_PREFILL_WHITELIST) {
      if (context[key] !== undefined) {
        initial[key] = context[key]
      }
    }

    setValues(initial)
  }, [schema, options, context])


  return (
    <Box
      component="form"
      autoComplete="off"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(values);
      }}
      display="flex"
      flexDirection="column"
      gap={2}
    >
      {/* ===== Autofill killers (sx ONLY) ===== */}
      <Box sx={{ position: "absolute", left: -10000, top: "auto" }}>
        <label htmlFor="fake-username">Username</label>
        <input
          id="fake-username"
          name="fake-username"
          type="text"
          autoComplete="username"
          aria-hidden="true"
        />
      </Box>

      <Box sx={{ position: "absolute", left: -10000, top: "auto" }}>
        <label htmlFor="fake-password">Password</label>
        <input
          id="fake-password"
          name="fake-password"
          type="password"
          autoComplete="new-password"
          aria-hidden="true"
        />
      </Box>

      {Object.entries(schema.properties).map(
        ([key, field]: any) => {
          const ui = field["x-ui"] ?? {};
          const widget = ui.widget ?? "text";
          const required = schema.required?.includes(key);
          const fieldError = fieldErrors[key];
          const helperText = fieldError
            ? t("providers.validation.backendError", {
                message: fieldError,
              })
            : undefined;

          /* ===== CONTEXT READONLY ===== */
          if (
            CONTEXT_PREFILL_WHITELIST.includes(key) &&
            context[key] !== undefined &&
            !ui.options_key
          ) {
            return (
              <TextField
                key={key}
                label={field.title}
                value={values[key]}
                disabled
                fullWidth
              />
            );
          }

          /* ===== SELECT ===== */
          if (widget === "select") {
            const opts = options[ui.options_key] ?? [];

            return (
              <FormControl
                key={key}
                fullWidth
                error={Boolean(fieldError)}
              >
                <InputLabel id={`${key}-label`} required={required}>
                  {field.title}
                </InputLabel>

                <Select
                  labelId={`${key}-label`}
                  name={`wizard-${schema.title}-${key}`}
                  label={field.title}
                  required={required}
                  disabled={loading || ui.readonly}
                  value={values[key] ?? ""}
                  onChange={(e) =>
                    setValues((v) => ({
                      ...v,
                      [key]: e.target.value,
                    }))
                  }
                >
                  <MenuItem value="" disabled>
                    {t("common.selectPlaceholder")}
                  </MenuItem>

                  {opts.map((opt) => {
                    const value = opt.value ?? opt.label;
                    return (
                      <MenuItem key={value} value={value}>
                        {opt.label} {opt.value}
                      </MenuItem>
                    );
                  })}
                </Select>
                {helperText && (
                  <FormHelperText>{helperText}</FormHelperText>
                )}
              </FormControl>
            );
          }

          /* ===== TEXT / PASSWORD / NUMBER ===== */
          return (
            <TextField
              key={key}
              name={`wizard-${schema.title}-${key}`}
              label={field.title}
              type={
                widget === "password"
                  ? "password"
                  : widget === "number"
                  ? "number"
                  : "text"
              }
              required={required}
              disabled={loading || ui.readonly}
              autoComplete={widget === "password" ? "new-password" : "off"}
              value={values[key] ?? ""}
              onChange={(e) =>
                setValues((v) => ({
                  ...v,
                  [key]: e.target.value,
                }))
              }
              error={Boolean(fieldError)}
              helperText={helperText}
            />

          );
        }
      )}

      <Button
        type="submit"
        variant="contained"
        disabled={loading}
      >
        {t("providers.wizard.actions.next")}
      </Button>
    </Box>
  );
}
