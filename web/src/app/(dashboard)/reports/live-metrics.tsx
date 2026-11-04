"use client";
import { useCallback, useEffect, useState } from "react";
import { ApiLatestMetric, fetchLatestMetrics } from "@/lib/server-api";

const REFRESH_MS = 15000; // tự làm mới mỗi 15 giây

const STATUS_LABEL: Record<string, string> = {
  ONLINE: "Trực tuyến",
  WARNING: "Cảnh báo",
  OFFLINE: "Mất kết nối",
  UNKNOWN: "Chưa rõ",
};
const STATUS_STYLE: Record<string, string> = {
  ONLINE: "bg-green-100 text-green-700",
  WARNING: "bg-orange-100 text-orange-700",
  OFFLINE: "bg-red-100 text-red-700",
  UNKNOWN: "bg-gray-200 text-gray-700",
};

// Hiển thị dung lượng cho dễ đọc (Backend gửi số, chưa rõ đơn vị nên hiểu là byte)
function formatBytes(n: number | null) {
  if (n === null || n === undefined) return "—";
  const v = Number(n);
  if (v >= 1048576) return `${(v / 1048576).toFixed(1)} MB`;
  if (v >= 1024) return `${(v / 1024).toFixed(1)} KB`;
  return `${v} B`;
}

export default function LiveMetrics() {
  const [rows, setRows] = useState<ApiLatestMetric[] | null>(null);
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState("");

  const load = useCallback(async () => {
    try {
      const data = await fetchLatestMetrics();
      setRows(data);
      setError("");
      setUpdatedAt(new Date().toLocaleTimeString("vi-VN"));
    } catch (err) {
      setRows(null);
      setError((err as Error).message);
    }
  }, []);

  useEffect(() => {
    void load();
    const timer = setInterval(() => void load(), REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  return (
    <div className="space-y-3 rounded-lg border border-gray-500/30 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-bold">Số liệu mới nhất từ Backend</h2>
        <div className="flex items-center gap-3 text-sm opacity-80">
          {updatedAt && <span>Cập nhật lúc {updatedAt}, tự làm mới mỗi 15 giây</span>}
          <button onClick={() => void load()} className="rounded border border-gray-500/30 px-3 py-1">
            Làm mới
          </button>
        </div>
      </div>

      {error && (
        <p className="rounded bg-orange-100 p-3 text-sm text-orange-800">
          Chưa lấy được số liệu thật: {error}. Các bảng bên dưới đang dùng dữ liệu giả. Để xem số liệu thật,
          hãy đăng nhập bằng email của Backend và kiểm tra địa chỉ Backend trong file .env.local.
        </p>
      )}

      {rows && rows.length === 0 && <p className="text-sm opacity-70">Backend chưa có máy chủ nào.</p>}

      {rows && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-500/10">
              <tr>
                <th className="p-2">Máy chủ</th>
                <th className="p-2">Trạng thái</th>
                <th className="p-2">CPU</th>
                <th className="p-2">RAM</th>
                <th className="p-2">Network vào</th>
                <th className="p-2">Network ra</th>
                <th className="p-2">Docker</th>
                <th className="p-2">Ghi nhận lúc</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const m = r.latest;
                const docker = m?.docker ?? [];
                const notRunning = docker.filter((c) => c.status !== "running");
                return (
                  <tr key={r.serverId} className="border-t border-gray-500/30">
                    <td className="p-2">
                      <p className="font-medium">{r.name}</p>
                      <p className="text-xs opacity-70">{r.serverCode}</p>
                    </td>
                    <td className="p-2">
                      <span className={`rounded px-2 py-1 ${STATUS_STYLE[r.status] ?? STATUS_STYLE.UNKNOWN}`}>
                        {STATUS_LABEL[r.status] ?? r.status}
                      </span>
                    </td>
                    {m === null ? (
                      <td className="p-2 opacity-70" colSpan={6}>
                        Chưa có số liệu
                      </td>
                    ) : (
                      <>
                        <td className="p-2">
                          <span
                            className={`rounded px-2 py-1 ${
                              Number(m.cpuUsage) > Number(r.cpuThreshold)
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {Number(m.cpuUsage)}%
                          </span>
                        </td>
                        <td className="p-2">
                          <span
                            className={`rounded px-2 py-1 ${
                              Number(m.ramUsage) > Number(r.ramThreshold)
                                ? "bg-red-100 text-red-700"
                                : "bg-green-100 text-green-700"
                            }`}
                          >
                            {Number(m.ramUsage)}%
                          </span>
                        </td>
                        <td className="p-2">{formatBytes(m.networkIn)}</td>
                        <td className="p-2">{formatBytes(m.networkOut)}</td>
                        <td className="p-2">
                          {docker.length === 0 ? (
                            "—"
                          ) : (
                            <>
                              {docker.length - notRunning.length}/{docker.length} chạy
                              {notRunning.length > 0 && (
                                <p className="text-xs text-red-600">
                                  Dừng: {notRunning.map((c) => c.name).join(", ")}
                                </p>
                              )}
                            </>
                          )}
                        </td>
                        <td className="p-2">{new Date(m.recordedAt).toLocaleString("vi-VN")}</td>
                      </>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-xs opacity-70">
        Màu đỏ nghĩa là vượt ngưỡng cảnh báo của máy chủ. Network hiển thị theo đơn vị Backend gửi (hiểu là byte).
      </p>
    </div>
  );
}
