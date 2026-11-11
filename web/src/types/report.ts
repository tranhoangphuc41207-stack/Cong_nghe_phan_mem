// ===== KAN-63: Báo cáo giám sát, capacity planning, PUE/điện năng =====
// Phạm vi báo cáo thống nhất: Site > Room > Rack > Node
export type ReportLevel = "SITE" | "ROOM" | "RACK" | "NODE";

export interface ReportItem {
  id: string;
  name: string;
  level: ReportLevel;
  parentName: string | null; // thuộc phạm vi cha nào (Node thuộc Rack, Rack thuộc Room...)
  nodeCount: number; // số node bên trong
  // Giám sát (7 ngày gần nhất)
  cpuAvg: number; // %
  cpuPeak: number; // %
  ramAvg: number; // %
  ramPeak: number; // %
  netAvg: number; // Mbps
  netPeak: number; // Mbps
  // Capacity planning
  cpuCores: number;
  ramGb: number;
  storageTb: number; // tổng dung lượng
  storageUsedTb: number; // đã dùng
  storageGrowthTbPerMonth: number; // tốc độ tăng mỗi tháng
  // PUE và điện năng
  itKw: number; // công suất thiết bị IT
  facilityKw: number; // tổng công suất cả hạ tầng (IT + làm mát + khác)
}
