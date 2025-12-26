import { useEffect, useMemo, useState } from "react";
import {
  Autocomplete,
  Box,
  Checkbox,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import {
  MicrocontrollerType,
  MICROCONTROLLER_TYPE_VALUES,
} from "@/features/microcontrollers/types/microcontrollerType";
import {
  createMicrocontrollerSchema,
  editMicrocontrollerSchema,
  CreateMicrocontrollerFormSchema,
  EditMicrocontrollerFormSchema,
} from "@/features/microcontrollers/schemas/microcontrollerFormSchema";
import { adminApi } from "@/api/adminApi";
import { UserResponse } from "@/features/users/types/user";
import { SENSOR_TYPE_VALUES } from "@/features/microcontrollers/types/sensorType";

type FormValues = CreateMicrocontrollerFormSchema | EditMicrocontrollerFormSchema;

type Props = {
  defaultValues?: Partial<FormValues>;
  onSubmit: (data: FormValues) => void;
  isEdit?: boolean;
};

const fieldSx = {
  "& .MuiOutlinedInput-root": {
    backgroundColor: "#ffffff",
    color: "#111827",

    "& fieldset": {
      borderColor: "#d1d5db",
    },
    "&:hover fieldset": {
      borderColor: "#9ca3af",
    },
    "&.Mui-focused fieldset": {
      borderColor: "#2563eb",
      borderWidth: 2,
    },
  },

  "& .MuiInputLabel-root": {
    color: "#374151",
    backgroundColor: "#ffffff",
    padding: "0 4px",
  },
  "& .MuiInputLabel-root.Mui-focused": {
    color: "#2563eb",
  },
  "& .MuiInputLabel-root.MuiInputLabel-shrink": {
    color: "#374151",
  },

  "& .MuiAutocomplete-inputRoot": {
    backgroundColor: "#ffffff",
  },

  "& .MuiChip-root": {
    backgroundColor: "#e5e7eb",
    color: "#111827",
    fontWeight: 500,
  },

  "& .MuiChip-deleteIcon": {
    color: "#374151",
    "&:hover": {
      color: "#111827",
    },
  },

  "& .MuiFormHelperText-root": {
    color: "#dc2626",
  },
};


export function MicrocontrollerForm({ defaultValues, onSubmit, isEdit }: Props) {
  const { t } = useTranslation();

  const [users, setUsers] = useState<UserResponse[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const schema = useMemo(
    () => (isEdit ? editMicrocontrollerSchema : createMicrocontrollerSchema),
    [isEdit]
  );

  useEffect(() => {
    setLoadingUsers(true);
    adminApi
      .getUsers()
      .then((res) => setUsers(res.data.items))
      .finally(() => setLoadingUsers(false));
  }, []);

  const { control, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    shouldUnregister: true,
    defaultValues: {
      user_id: undefined,
      name: "",
      description: "",
      software_version: "",
      type: MicrocontrollerType.RASPBERRY_PI_ZERO,
      max_devices: 4,
      assigned_sensors: [],
      enabled: true,
      ...defaultValues,
    } as Partial<FormValues>,
    mode: "onSubmit",
  });

  return (
    <Box
      component="form"
      id="microcontroller-form"
      onSubmit={handleSubmit(
        (data) => {
          const safeData = {
            ...data,
            assigned_sensors: (data as any).assigned_sensors ?? [],
          } as FormValues;

          onSubmit(safeData);
        },
        (errors) => {
          console.error("Microcontroller form validation failed:", errors);
        }
      )}
      sx={{ pt: 1 }}
    >
      <Stack spacing={2}>
        <Controller
          name="user_id"
          control={control}
          render={({ field, fieldState }) => (
            <Autocomplete
              options={users}
              loading={loadingUsers}
              value={users.find((u) => u.id === field.value) ?? null}
              onChange={(_, user) => field.onChange(user ? user.id : undefined)}
              isOptionEqualToValue={(a, b) => a.id === b.id}
              getOptionLabel={(u) => u.email}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t("microcontroller.form.user")}
                  error={!!fieldState.error}
                  helperText={fieldState.error?.message}
                  fullWidth
                  sx={fieldSx}
                />
              )}
            />
          )}
        />

        {/* NAME */}
        <Controller
          name="name"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label={t("microcontroller.form.name")}
              required 
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              fullWidth
              sx={fieldSx}
            />
          )}
        />

        {/* DESCRIPTION */}
        <Controller
          name="description"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label={t("microcontroller.form.description")}
              multiline
              rows={2}
              fullWidth
              sx={fieldSx}
            />
          )}
        />

        {/* SOFTWARE VERSION */}
        <Controller
          name="software_version"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              label={t("microcontroller.form.softwareVersion")}
              fullWidth
            />
          )}
        />

        {/* TYPE – tylko CREATE */}
        {!isEdit && (
          <Controller
            name="type"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                select
                label={t("microcontroller.form.type")}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                fullWidth
                sx={fieldSx}
              >
                {MICROCONTROLLER_TYPE_VALUES.map((type) => (
                  <MenuItem key={type} value={type}>
                    {t(`microcontroller.types.${type}`)}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
        )}

        {/* SENSORS (CREATE + EDIT) */}
        <Controller
          name="assigned_sensors"
          control={control}
          render={({ field }) => (
            <Autocomplete
              multiple
              options={SENSOR_TYPE_VALUES}
              value={field.value ?? []}
              onChange={(_, value) => field.onChange(value)}
              disableCloseOnSelect
              getOptionLabel={(opt) => t(`microcontroller.sensorOptions.${opt}`)}
              renderOption={(props, option, { selected }) => (
                <li {...props}>
                  <Checkbox checked={selected} sx={{ mr: 1 }} />
                  {t(`microcontroller.sensorOptions.${option}`)}
                </li>
              )}
              renderInput={(params) => (
                <TextField
                  {...params}
                  label={t("microcontroller.form.sensors")}
                  fullWidth
                  sx={fieldSx}
                />
              )}
            />
          )}
        />

        {/* MAX DEVICES ✅ konwersja string -> number */}
        <Controller
          name="max_devices"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              type="number"
              label={t("microcontroller.form.maxDevices")}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              inputProps={{ min: 1 }}
              fullWidth
              sx={fieldSx}
              onChange={(e) => {
                const value = e.target.value;
                field.onChange(value === "" ? undefined : Number(value));
              }}
            />
          )}
        />

        {/* ENABLED – tylko EDIT */}
        {isEdit && (
          <Controller
            name="enabled"
            control={control}
            render={({ field }) => (
              <FormControlLabel
                control={<Switch checked={!!field.value} onChange={(_, v) => field.onChange(v)} />}
                label={t("microcontroller.form.enabled")}
              />
            )}
          />
        )}
      </Stack>
    </Box>
  );
}
