import { Hardware, MaintenanceRecord } from "@/types/hardware";

// Dữ liệu giả để làm giao diện. Khi có API thật (KAN-64) thì thay bằng dữ liệu từ API.
export const mockHardware: Hardware[] = [
  { id: "HW-001", name: "Dell PowerEdge R650", type: "SERVER", serverId: "1", serverName: "srv-web-01", vendor: "Dell", model: "R650", serialNumber: "DL-R650-0001", purchaseDate: "2024-03-15", warrantyEnd: "2027-03-15", status: "ACTIVE" },
  { id: "HW-002", name: "Dell PowerEdge R750", type: "SERVER", serverId: "2", serverName: "srv-db-01", vendor: "Dell", model: "R750", serialNumber: "DL-R750-0002", purchaseDate: "2023-01-10", warrantyEnd: "2026-01-10", status: "ACTIVE" },
  { id: "HW-003", name: "SSD Samsung PM9A3 1.9TB", type: "DISK", serverId: "2", serverName: "srv-db-01", vendor: "Samsung", model: "PM9A3", serialNumber: "SS-PM9A3-0003", purchaseDate: "2023-01-10", warrantyEnd: "2026-12-10", status: "ACTIVE" },
  { id: "HW-004", name: "RAM DDR4 32GB ECC", type: "RAM", serverId: "2", serverName: "srv-db-01", vendor: "Kingston", model: "KSM32RD4", serialNumber: "KS-DDR4-0004", purchaseDate: "2023-01-10", warrantyEnd: "2028-01-10", status: "ACTIVE" },
  { id: "HW-005", name: "HPE ProLiant DL380", type: "SERVER", serverId: "3", serverName: "srv-app-02", vendor: "HPE", model: "DL380 Gen10", serialNumber: "HP-DL380-0005", purchaseDate: "2022-06-01", warrantyEnd: "2025-06-01", status: "MAINTENANCE" },
  { id: "HW-006", name: "Nguồn PSU 800W", type: "PSU", serverId: "3", serverName: "srv-app-02", vendor: "HPE", model: "HPE-800W", serialNumber: "HP-PSU-0006", purchaseDate: "2022-06-01", warrantyEnd: "2026-11-20", status: "MAINTENANCE" },
  { id: "HW-007", name: "Card mạng Intel X710", type: "NETWORK", serverId: "3", serverName: "srv-app-02", vendor: "Intel", model: "X710-DA2", serialNumber: "IN-X710-0007", purchaseDate: "2022-06-01", warrantyEnd: "2027-06-01", status: "ACTIVE" },
  { id: "HW-008", name: "Lenovo ThinkSystem SR630", type: "SERVER", serverId: "4", serverName: "srv-cache-01", vendor: "Lenovo", model: "SR630", serialNumber: "LN-SR630-0008", purchaseDate: "2024-09-20", warrantyEnd: "2027-09-20", status: "ACTIVE" },
  { id: "HW-009", name: "RAM DDR4 16GB", type: "RAM", serverId: "4", serverName: "srv-cache-01", vendor: "Samsung", model: "M393A2K43", serialNumber: "SS-DDR4-0009", purchaseDate: "2024-09-20", warrantyEnd: "2026-10-30", status: "ACTIVE" },
  { id: "HW-010", name: "Supermicro SYS-1029", type: "SERVER", serverId: "5", serverName: "srv-mon-01", vendor: "Supermicro", model: "SYS-1029P", serialNumber: "SM-1029-0010", purchaseDate: "2021-04-12", warrantyEnd: "2024-04-12", status: "ACTIVE" },
  { id: "HW-011", name: "HDD Seagate Exos 8TB", type: "DISK", serverId: "5", serverName: "srv-mon-01", vendor: "Seagate", model: "Exos X18", serialNumber: "SG-EXOS-0011", purchaseDate: "2021-04-12", warrantyEnd: "2026-04-12", status: "RETIRED" },
  { id: "HW-012", name: "Card mạng Broadcom 10G", type: "NETWORK", serverId: "1", serverName: "srv-web-01", vendor: "Broadcom", model: "BCM57416", serialNumber: "BC-57416-0012", purchaseDate: "2024-03-15", warrantyEnd: "2029-03-15", status: "ACTIVE" },
];

export const mockMaintenance: MaintenanceRecord[] = [
  { id: "MT-001", hardwareId: "HW-005", date: "2026-10-20", type: "REPAIR", technician: "tech-an", description: "Kiểm tra mất kết nối, nghi ngờ lỗi nguồn và cáp mạng." },
  { id: "MT-002", hardwareId: "HW-005", date: "2026-05-12", type: "PREVENTIVE", technician: "tech-binh", description: "Vệ sinh bụi, kiểm tra quạt và nhiệt độ." },
  { id: "MT-003", hardwareId: "HW-006", date: "2026-10-20", type: "REPLACE", technician: "tech-an", description: "Thay nguồn PSU dự phòng để kiểm tra." },
  { id: "MT-004", hardwareId: "HW-002", date: "2026-09-02", type: "PREVENTIVE", technician: "tech-cuong", description: "Kiểm tra CPU nhiệt độ cao, thay keo tản nhiệt." },
  { id: "MT-005", hardwareId: "HW-001", date: "2026-08-15", type: "PREVENTIVE", technician: "tech-binh", description: "Bảo trì định kỳ 6 tháng, cập nhật firmware." },
  { id: "MT-006", hardwareId: "HW-011", date: "2026-03-30", type: "REPLACE", technician: "tech-cuong", description: "Ổ cứng báo lỗi SMART, thay ổ mới và ngừng sử dụng ổ cũ." },
];
