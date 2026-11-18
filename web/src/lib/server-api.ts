import { apiFetch } from "@/lib/api";
import { Hardware } from "@/types/hardware";

// ===== Dữ liệu trả về từ Backend NestJS (module servers và metrics) =====

export interface ApiServer {
  id: number;
  serverCode: string;
  name: string;
  description: string | null;
  location: string | null;
  qrCode: string | null;
  status: "ONLINE" | "OFFLINE" | "WARNING" | "UNKNOWN";
  cpuThreshold: number;
  ramThreshold: number;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  cpuModel: string | null;
  ramGb: number | null;
  storageGb: number | null;
  purchaseDate: string | null;
  warrantyExpiry: string | null;
  createdAt: string;
}

export interface ApiLatestMetric {
  serverId: number;
  serverCode: string;
  name: string;
  status: string;
  cpuThreshold: number;
  ramThreshold: number;
  // null nếu máy chủ chưa có số liệu nào
  latest: {
    cpuUsage: number;
    ramUsage: number;
    networkIn: number | null;
    networkOut: number | null;
    docker: { name: string; status: string }[] | null;
    recordedAt: string;
  } | null;
}

export function fetchServers() {
  return apiFetch<ApiServer[]>("/servers");
}

export function fetchLatestMetrics() {
  return apiFetch<ApiLatestMetric[]>("/metrics/latest");
}

// Backend có thể trả cả giờ, chỉ lấy phần ngày YYYY-MM-DD
const day = (v: string | null) => (v ? v.slice(0, 10) : "");

// Chuyển một máy chủ của Backend thành dòng trong trang Phần cứng.
// Backend lưu thông tin phần cứng ngay trong bảng servers nên mỗi máy chủ là một dòng.
export function serverToHardware(s: ApiServer): Hardware {
  const specs = [
    s.cpuModel,
    s.ramGb ? `${s.ramGb} GB RAM` : null,
    s.storageGb ? `${s.storageGb} GB lưu trữ` : null,
  ]
    .filter(Boolean)
    .join(", ");

  return {
    id: s.serverCode,
    name: s.name,
    type: "SERVER",
    serverId: String(s.id),
    serverName: s.name,
    vendor: s.manufacturer ?? "—",
    model: s.model ?? "—",
    serialNumber: s.serialNumber ?? "—",
    purchaseDate: day(s.purchaseDate),
    warrantyEnd: day(s.warrantyExpiry),
    status: s.status === "ONLINE" ? "ACTIVE" : s.status,
    location: s.location ?? undefined,
    specs: specs || undefined,
  };
}

// ===== Thêm máy chủ mới (POST /servers, chỉ ADMIN) =====

export interface CreateServerInput {
  serverCode: string; // duy nhất, tối đa 50 ký tự
  name: string; // tối đa 100 ký tự
  description?: string;
  location?: string;
  manufacturer?: string;
  model?: string;
  serialNumber?: string;
  cpuModel?: string;
  ramGb?: number;
  storageGb?: number;
  purchaseDate?: string; // YYYY-MM-DD
  warrantyExpiry?: string; // YYYY-MM-DD
}

export function createServer(body: CreateServerInput) {
  return apiFetch<ApiServer>("/servers", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

// Tự sinh mã và tên cho máy chủ kế tiếp dựa trên danh sách hiện có:
// SRV-001, SRV-002, ... (lấy số lớn nhất đang có rồi cộng 1, bỏ qua mã đã bị trùng)
export function nextServerDefaults(list: ApiServer[]) {
  const used = new Set(list.map((s) => s.serverCode.toLowerCase()));
  let n =
    list.reduce((max, s) => {
      const m = /^SRV-(\d+)$/i.exec(s.serverCode);
      return m ? Math.max(max, Number(m[1])) : max;
    }, 0) + 1;
  let code = "";
  do {
    code = `SRV-${String(n).padStart(3, "0")}`;
    n++;
  } while (used.has(code.toLowerCase()));
  return { serverCode: code, name: code.toLowerCase() };
}