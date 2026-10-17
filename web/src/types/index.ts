export type Role = "ADMIN" | "OPERATOR" | "TECHNICIAN";

export interface User {
  id: string;
  username: string;
  role: Role;
}