import { z } from "zod";
import i18n from "@/i18n/config";
import {
  MICROCONTROLLER_TYPE_VALUES,
} from "@/features/microcontrollers/types/microcontrollerType";

/* =========================
   CREATE
========================= */
export const createMicrocontrollerSchema = z.object({
  user_id: z
    .number()
    .int()
    .min(1, i18n.t("errors.validation.required"))
    .optional(),

  name: z.string().min(1, i18n.t("errors.validation.required")),
  description: z.string().optional(),
  software_version: z.string().optional(),
  type: z.enum(MICROCONTROLLER_TYPE_VALUES),

  max_devices: z
    .number()
    .int()
    .min(1, i18n.t("errors.validation.minDevices")),

  assigned_sensors: z.array(z.string()).default([]),
});


export type CreateMicrocontrollerFormSchema =
  z.infer<typeof createMicrocontrollerSchema>;

/* =========================
   EDIT
========================= */
export const editMicrocontrollerSchema = z.object({
  user_id: z
    .number()
    .int()
    .min(1, i18n.t("errors.validation.required"))
    .optional(),

  name: z.string().optional(),
  description: z.string().optional(),
  software_version: z.string().optional(),
  max_devices: z
    .number()
    .int()
    .min(1, i18n.t("errors.validation.minDevices"))
    .optional(),
  assigned_sensors: z.array(z.string()).optional(),
  enabled: z.boolean().optional(),
});

export type EditMicrocontrollerFormSchema =
  z.infer<typeof editMicrocontrollerSchema>;
