// ===== KAN-62 / KAN-64: Phần cứng, bảo hành, lịch sử bảo trì =====
export type HardwareType = "SERVER" | "DISK" | "RAM" | "NETWORK" | "PSU";

// Trạng thái của thiết bị. ACTIVE, MAINTENANCE, RETIRED dùng cho dữ liệu giả;
// WARNING, OFFLINE, UNKNOWN lấy từ trạng thái máy chủ của Backend.
export type HardwareStatus =
  | "ACTIVE"
  | "WARNING"
  | "OFFLINE"
  | "UNKNOWN"
  | "MAINTENANCE"
  | "RETIRED";

// Loại công việc bảo trì
export type MaintenanceType = "PREVENTIVE" | "REPAIR" | "REPLACE";

export interface Hardware {
  id: string;
  name: string;
  type: HardwareType;
  serverId: string; // gắn với máy chủ nào
  serverName: string;
  vendor: string;
  model: string;
  serialNumber: string;
  purchaseDate: string; // "2024-03-15", rỗng nếu chưa có
  warrantyEnd: string; // "2027-03-15", rỗng nếu chưa có thông tin bảo hành
  status: HardwareStatus;
  location?: string; // vị trí, chỉ có khi lấy từ Backend
  specs?: string; // cấu hình tóm tắt, chỉ có khi lấy từ Backend
  // KAN-62: thông số chi tiết và bảo hành, nhập ở form "Sửa thông tin" (mục 3.2.13.2)
  cpu?: string;
  ram?: string;
  storage?: string; // ổ đĩa
  nic?: string; // card mạng
  supplier?: string; // nhà cung cấp
  warrantyStart?: string; // ngày bắt đầu bảo hành, vd "2024-03-15"
}

export interface MaintenanceRecord {
  id: string;
  hardwareId: string;
  date: string; // "2026-09-10"
  type: MaintenanceType;
  technician: string;
  description: string;
}
