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

export type AlertLevel = "CRITICAL" | "WARNING";

export interface Alert {
  id: string;
  serverId: string;
  serverName: string;
  level: AlertLevel;
  message: string;
  time: string;
  resolved: boolean;
}

export interface Threshold {
  cpu: number;
  ram: number;
  offlineSeconds: number;
}

export interface AppUser {
  id: string;
  username: string;
  fullName: string;
  role: Role;
  active: boolean;
}