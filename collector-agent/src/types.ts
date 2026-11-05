// Định dạng telemetry mà Agent gửi về Backend (cần thống nhất với Người 1).
export interface NetworkSample {
  iface: string;
  rxBytesPerSec: number;
  txBytesPerSec: number;
}

export interface ContainerSample {
  id: string;
  name: string;
  image: string;
  state: string; // running | exited | ...
  cpuPercent: number | null;
  memUsageBytes: number | null;
  memLimitBytes: number | null;
}

export interface Telemetry {
  agentId: string;
  hostname: string;
  seq: number; // số thứ tự tăng dần, Backend dùng để loại bản trùng khi gửi lại
  timestamp: string; // ISO 8601, thời điểm thu thập (không phải thời điểm gửi)
  intervalMs: number;
  cpu: { usagePercent: number; cores: number; load1: number };
  memory: { totalBytes: number; usedBytes: number; usagePercent: number };
  network: NetworkSample[];
  docker: { available: boolean; containers: ContainerSample[] };
}

// Định dạng Backend (Bảo) đang nhận ở POST /metrics. Xem API.docx.
export interface BackendMetric {
  serverCode: string;
  cpuUsage: number; // 0-100 (%)
  ramUsage: number; // 0-100 (%)
  networkIn: number; // byte/giây, số nguyên
  networkOut: number; // byte/giây, số nguyên
  docker: { name: string; status: string; cpuPercent: number; memMb: number }[];
  recordedAt: string; // ISO 8601
}
