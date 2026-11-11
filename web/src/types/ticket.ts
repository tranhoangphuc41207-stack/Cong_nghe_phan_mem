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
  assignee: string | null;
  alertId: string | null;
  createdBy: string;
  createdAt: string;
  note: string | null;
}