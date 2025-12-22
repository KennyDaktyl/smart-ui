export const buildInitialFormData = (schema: any, prev: Record<string, any>) => {
  if (!schema?.properties) return {};
  const next: Record<string, any> = {};
  Object.entries(schema.properties).forEach(([key, field]) => {
    if (prev[key] !== undefined) {
      next[key] = prev[key];
      return;
    }
    if (field?.default !== undefined) {
      next[key] = field.default;
      return;
    }
    if (field?.type === "boolean") {
      next[key] = false;
      return;
    }
    next[key] = "";
  });
  return next;
};

export const applyContextToForm = (
  schema: any,
  base: Record<string, any>,
  context: Record<string, any> | null
) => {
  if (!schema?.properties || !context) return base;
  const next = { ...base };
  Object.keys(schema.properties).forEach((key) => {
    if (key in context && context[key] != null) {
      next[key] = context[key];
    }
  });
  return next;
};

export const coerceSchemaValues = (schema: any, values: Record<string, any>) => {
  if (!schema?.properties) return values;
  const payload: Record<string, any> = {};
  Object.entries(schema.properties).forEach(([key, field]) => {
    const rawValue = values[key];
    if ((field?.type === "number" || field?.type === "integer") && rawValue !== "") {
      payload[key] = Number(rawValue);
    } else {
      payload[key] = rawValue;
    }
  });
  return payload;
};
