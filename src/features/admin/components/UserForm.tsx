import {
  Stack,
  TextField,
  Switch,
  FormControlLabel,
  MenuItem,
  Box,
} from "@mui/material";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslation } from "react-i18next";

import {
  createUserSchema,
  editUserSchema,
  CreateUserFormSchema,
  EditUserFormSchema,
} from "../schemas/userFormSchema";
import { UserRole, USER_ROLE_VALUES } from "@/features/users/types/role";

type UserFormValues = CreateUserFormSchema | EditUserFormSchema;

type Props = {
  defaultValues?: Partial<UserFormValues>;
  onSubmit: (data: UserFormValues) => void;
  isEdit?: boolean;
};

export function UserForm({ defaultValues, onSubmit, isEdit }: Props) {
  const { t } = useTranslation();

  const schema = isEdit ? editUserSchema : createUserSchema;

  const { control, handleSubmit } = useForm<UserFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      role: UserRole.NEW,
      is_active: true,
      ...defaultValues,
    },
    mode: "onSubmit",
  });

  return (
    <Box
      component="form"
      id="user-form"
      onSubmit={handleSubmit(onSubmit)}
      sx={{ pt: 1 }}
    >
      <Stack spacing={2}>
        <Controller
          name="email"
          control={control}
          render={({ field, fieldState }) => (
            <TextField
              {...field}
              label={t("user.form.email")}
              error={!!fieldState.error}
              helperText={fieldState.error?.message}
              fullWidth
            />
          )}
        />

        {/* PASSWORD – tylko CREATE */}
        {!isEdit && (
          <Controller
            name="password"
            control={control}
            render={({ field, fieldState }) => (
              <TextField
                {...field}
                type="password"
                label={t("user.form.password")}
                error={!!fieldState.error}
                helperText={fieldState.error?.message}
                fullWidth
              />
            )}
          />
        )}

        {/* ROLE */}
        <Controller
          name="role"
          control={control}
          render={({ field }) => (
            <TextField
              {...field}
              select
              label={t("user.form.role")}
              fullWidth
            >
              {USER_ROLE_VALUES.map((role) => (
                <MenuItem key={role} value={role}>
                  {role}
                </MenuItem>
              ))}
            </TextField>
          )}
        />

        {/* ACTIVE */}
        <Controller
          name="is_active"
          control={control}
          render={({ field }) => (
            <FormControlLabel
              control={<Switch {...field} checked={field.value} />}
              label={t("user.form.isActive")}
            />
          )}
        />
      </Stack>
    </Box>
  );
}
