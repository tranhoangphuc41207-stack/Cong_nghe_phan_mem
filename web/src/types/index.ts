export type Role = "ADMIN" | "OPERATOR" | "TECHNICIAN";

export interface User {
  id: string;
  username: string;
  role: Role;
}

export type ServerStatus = "ONLINE" | "OFFLINE" | "WARNING";

export interface Server {
  id: string;
  name: string;
  ip: string;
  location: string;
  status: ServerStatus;
  cpu: number;
  ram: number;
  network: number;
}