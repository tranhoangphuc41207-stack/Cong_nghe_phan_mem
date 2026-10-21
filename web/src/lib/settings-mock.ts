import { SystemSettings } from "@/types";

// Giá trị mặc định giả. Khi có API thật thì đọc từ API.
export const defaultSettings: SystemSettings = {
  systemName: "Data Center Mini",
  refreshSeconds: 5,
  retentionDays: 30,
  emailAlerts: true,
  soundAlerts: false,
};