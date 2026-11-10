import { Alert, Threshold } from "@/types";

// Dữ liệu giả để làm giao diện. Khi có API thật thì thay bằng dữ liệu từ API.
export const mockAlerts: Alert[] = [
  { id: "a1", serverId: "2", serverName: "srv-db-01", level: "CRITICAL", message: "CPU vượt ngưỡng 85% (đang 88%)", time: "21/10/2026 07:40", resolved: false },
  { id: "a2", serverId: "2", serverName: "srv-db-01", level: "CRITICAL", message: "RAM vượt ngưỡng 90% (đang 91%)", time: "21/10/2026 07:12", resolved: false },
  { id: "a3", serverId: "3", serverName: "srv-app-02", level: "CRITICAL", message: "Mất kết nối quá 90 giây", time: "20/10/2026 22:05", resolved: false },
  { id: "a4", serverId: "5", serverName: "srv-mon-01", level: "WARNING", message: "RAM đạt 70%, gần ngưỡng cảnh báo", time: "20/10/2026 18:30", resolved: true },
];

export const defaultThreshold: Threshold = {
  cpu: 85,
  ram: 90,
  offlineSeconds: 90,
};