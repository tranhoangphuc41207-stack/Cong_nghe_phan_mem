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

// ===== KAN-61: Ticket bảo trì =====
// Vòng đời: OPEN -> IN_PROGRESS -> RESOLVED -> CLOSED
export type TicketStatus = "OPEN" | "IN_PROGRESS" | "RESOLVED" | "CLOSED";

export type TicketPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface Ticket {
  id: string;
  title: string;
  description: string;
  serverId: string;
  serverName: string;
  priority: TicketPriority;
  status: TicketStatus;
  assignee: string | null; // tên technician, null nếu chưa gán
  alertId: string | null; // mã cảnh báo gốc (nếu tạo từ cảnh báo)
  createdBy: string;
  createdAt: string; // dạng "2026-10-20 09:30"
  note: string | null; // ghi chú xử lý của technician
}
