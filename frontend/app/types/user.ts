export type UserRole = "admin" | "analyst" | "approver";
export type UserStatus = "active" | "inactive";

export type Profile = {
  user_id: string;
  full_name: string;
  email: string;
  role: UserRole;
  status: UserStatus;
};
