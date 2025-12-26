import { UserRole } from "@/features/users/types/role";

export const USER_ROLE_LABEL: Record<UserRole, string> = {
  admin: "Admin",
  new: "New",
  client: "Client",
  client_pro: "Client PRO",
  demo: "Demo",
};

export const USER_ROLE_COLOR: Record<
  UserRole,
  "default" | "primary" | "secondary" | "success" | "warning"
> = {
  admin: "secondary",
  new: "warning",
  client: "primary",
  client_pro: "success",
  demo: "default",
};
