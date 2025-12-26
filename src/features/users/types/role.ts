export enum UserRole {
  ADMIN = "admin",
  NEW = "new",
  CLIENT = "client",
  CLIENT_PRO = "client_pro",
  DEMO = "demo",
}

export const USER_ROLE_VALUES = [
  UserRole.ADMIN,
  UserRole.NEW,
  UserRole.CLIENT,
  UserRole.CLIENT_PRO,
  UserRole.DEMO,
] as const;
