import { UserRole } from "@/features/users/types/role";

export type UserFormPayload = {
  email: string;
  password?: string;
  role: UserRole
  is_active: boolean;
};
