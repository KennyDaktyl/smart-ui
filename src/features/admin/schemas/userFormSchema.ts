import { z } from "zod";
import i18n from "@/i18n/config";
import { USER_ROLE_VALUES } from "@/features/users/types/role";

export const createUserSchema = z.object({
  email: z
    .email({ message: i18n.t("errors.validation.emailInvalid") })
    .min(1, { message: i18n.t("errors.validation.emailRequired") }),

  password: z
    .string()
    .min(8, { message: i18n.t("errors.validation.passwordTooShort") }),

  role: z.enum(USER_ROLE_VALUES),

  is_active: z.boolean(),
});

export const editUserSchema = z.object({
  email: z
    .email({ message: i18n.t("errors.validation.emailInvalid") })
    .min(1, { message: i18n.t("errors.validation.emailRequired") }),

  password: z.string().optional(),

  role: z.enum(USER_ROLE_VALUES),

  is_active: z.boolean(),
});

export type CreateUserFormSchema = z.infer<typeof createUserSchema>;
export type EditUserFormSchema = z.infer<typeof editUserSchema>;
