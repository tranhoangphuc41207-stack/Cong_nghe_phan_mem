// ===== KAN-62: Phần cứng, bảo hành, lịch sử bảo trì =====
export type HardwareType = "SERVER" | "DISK" | "RAM" | "NETWORK" | "PSU";

// Trạng thái hoạt động của thiết bị
export type HardwareStatus = "ACTIVE" | "MAINTENANCE" | "RETIRED";

// Loại công việc bảo trì
export type MaintenanceType = "PREVENTIVE" | "REPAIR" | "REPLACE";

export interface Hardware {
  id: string;
  name: string;
  type: HardwareType;
  serverId: string; // gắn với máy chủ nào (khớp id trong mockServers)
  serverName: string;
  vendor: string;
  model: string;
  serialNumber: string;
  purchaseDate: string; // "2024-03-15"
  warrantyEnd: string; // "2027-03-15"
  status: HardwareStatus;
}

export interface MaintenanceRecord {
  id: string;
  hardwareId: string;
  date: string; // "2026-09-10"
  type: MaintenanceType;
  technician: string;
  description: string;
}
