import { UserProfileResponse } from "./profile";
import { UserRole } from "./role";

export interface UserResponse {
  id: number;
  email: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export type UserDetailsResponse = UserResponse & {
  profile?: UserProfileResponse | null;
};