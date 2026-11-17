
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { io, type Socket } from "socket.io-client";

import { getUser } from "@/lib/auth";
import { API_URL, apiFetch, getToken } from "@/lib/api";
import { fetchServers } from "@/lib/server-api";
import { defaultThreshold } from "@/lib/alerts-mock";
import type { Alert, AlertLevel, Threshold } from "@/types";

const LEVEL_STYLE: Record<AlertLevel, string> = {
  CRITICAL: "bg-red-100 text-red-700",
  WARNING: "bg-yellow-100 text-yellow-700",
};

type Tab = "ALL" | "OPEN" | "RESOLVED";

const TABS: { value: Tab; label: string }[] = [
  { value: "ALL", label: "Tất cả" },
  { value: "OPEN", label: "Chưa xử lý" },
  { value: "RESOLVED", label: "Đã xử lý" },
];

// Kiểu dữ liệu cảnh báo Backend trả về
interface BackendAlert {
  id: number;
  serverId: number;
  alertType: string;
  message: string;
  severity: string;
  status: string;
  createdAt: string;
  acknowledgedBy: number | null;
  acknowledgedAt: string | null;
}

interface AlertsResponse {
  data: BackendAlert[];
  total: number;
  page: number;
  limit: number;
}

// Chuyển dữ liệu Backend thành kiểu Alert của giao diện
function mapBackendAlert(
  item: BackendAlert,
  serverNames: Map<number, string>,
): Alert {
  const date = new Date(item.createdAt);

  return {
    id: String(item.id),
    serverId: String(item.serverId),
    serverName:
      serverNames.get(item.serverId) ?? `Server ${item.serverId}`,
    level: item.severity === "CRITICAL" ? "CRITICAL" : "WARNING",
    message: item.message,
    time: Number.isNaN(date.getTime())
      ? item.createdAt
      : date.toLocaleString("vi-VN"),
    resolved: item.status === "RESOLVED",
  };
}

// Thêm hoặc cập nhật cảnh báo, tránh tạo bản ghi trùng trên giao diện
function upsertAlert(previous: Alert[], incoming: Alert): Alert[] {
  const exists = previous.some((item) => item.id === incoming.id);

  if (!exists) {
    return [incoming, ...previous];
  }

  return previous.map((item) =>
    item.id === incoming.id ? incoming : item,
  );
}

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [tab, setTab] = useState<Tab>("ALL");

  const [threshold, setThreshold] =
    useState<Threshold>(defaultThreshold);

  const [isAdmin, setIsAdmin] = useState(false);
  const [canResolve, setCanResolve] = useState(false);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  const [realtimeStatus, setRealtimeStatus] =
    useState("Đang kết nối realtime...");

  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const serverNamesRef = useRef<Map<number, string>>(new Map());

  // Tải cảnh báo và kết nối Socket.IO
  useEffect(() => {
    let active = true;
    let socket: Socket | null = null;

    async function initialize() {
      const user = getUser();

      setIsAdmin(user?.role === "ADMIN");
      setCanResolve(
        user?.role === "ADMIN" || user?.role === "OPERATOR",
      );

      const token = getToken();

      if (!token) {
        setError("Bạn chưa đăng nhập bằng tài khoản Backend.");
        setRealtimeStatus("Chưa đăng nhập");
        setLoading(false);
        return;
      }

      // Lấy tên máy chủ để hiển thị trên bảng cảnh báo
      try {
        const servers = await fetchServers();

        if (!active) return;

        serverNamesRef.current = new Map(
          servers.map((server) => [
            server.id,
            server.name || server.serverCode,
          ]),
        );
      } catch (err) {
        console.error("Không tải được danh sách Server:", err);
      }

      // Lấy danh sách cảnh báo thật từ Backend
      try {
        const result = await apiFetch<AlertsResponse>(
          "/alerts?page=1&limit=200",
        );

        if (!active) return;

        const mapped = result.data.map((item) =>
          mapBackendAlert(item, serverNamesRef.current),
        );

        setAlerts(mapped);
        setError("");
      } catch (err) {
        if (active) {
          setError(
            err instanceof Error
              ? err.message
              : "Không tải được danh sách cảnh báo",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }

      if (!active) return;

      // Kết nối Socket.IO bằng JWT đã đăng nhập
      socket = io(API_URL, {
        auth: {
          token,
        },
      });

      socket.on("connect", () => {
        if (active) {
          setRealtimeStatus("Đã kết nối realtime");
        }
      });

      socket.on("connect_error", (err) => {
        if (active) {
          setRealtimeStatus("Lỗi kết nối realtime");
          setError(`Socket.IO: ${err.message}`);
        }
      });

      socket.on("disconnect", () => {
        if (active) {
          setRealtimeStatus("Mất kết nối realtime");
        }
      });

      // Xử lý cả ba sự kiện cảnh báo
      const handleAlertEvent = (item: BackendAlert) => {
        const mapped = mapBackendAlert(
          item,
          serverNamesRef.current,
        );

        if (active) {
          setAlerts((previous) => upsertAlert(previous, mapped));
        }
      };

      socket.on("alert:new", handleAlertEvent);
      socket.on("alert:updated", handleAlertEvent);
      socket.on("alert:resolved", handleAlertEvent);
    }

    void initialize();

    return () => {
      active = false;
      socket?.disconnect();
    };
  }, []);

  const list = alerts.filter(
    (item) =>
      tab === "ALL" ||
      (tab === "OPEN" ? !item.resolved : item.resolved),
  );

  const openCount = alerts.filter(
    (item) => !item.resolved,
  ).length;

  // Giải quyết cảnh báo trên Backend
  async function resolve(id: string) {
    if (!canResolve) return;

    setResolvingId(id);
    setError("");

    try {
      const result = await apiFetch<BackendAlert>(
        `/alerts/${id}/resolve`,
        {
          method: "PATCH",
        },
      );

      const mapped = mapBackendAlert(
        result,
        serverNamesRef.current,
      );

      setAlerts((previous) => upsertAlert(previous, mapped));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Không thể giải quyết cảnh báo",
      );
    } finally {
      setResolvingId(null);
    }
  }

  function changeThreshold(
    key: keyof Threshold,
    value: string,
  ) {
    setMessage("");
    setThreshold((previous) => ({
      ...previous,
      [key]: Number(value),
    }));
  }

  function saveThreshold() {
    const { cpu, ram, offlineSeconds } = threshold;

    if (cpu < 1 || cpu > 100 || ram < 1 || ram > 100) {
      setMessage("CPU và RAM phải từ 1 đến 100%");
      return;
    }

    if (offlineSeconds < 10) {
      setMessage("Thời gian mất kết nối tối thiểu là 10 giây");
      return;
    }

    setMessage(
      "Đã lưu ngưỡng giao diện (chưa đồng bộ Backend)",
    );
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Cảnh báo</h1>

        <span
          className={`rounded-full px-3 py-1 text-sm ${
            realtimeStatus === "Đã kết nối realtime"
              ? "bg-green-100 text-green-700"
              : "bg-gray-200 text-gray-700"
          }`}
        >
          {realtimeStatus}
        </span>
      </div>

      {error && (
        <div
          className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Ngưỡng cảnh báo */}
      <div className="rounded-lg border border-gray-500/30 p-4">
        <h2 className="mb-3 font-bold">Ngưỡng cảnh báo</h2>

        <div className="grid gap-4 md:grid-cols-3">
          <label className="block text-sm">
            CPU (%)
            <input
              type="number"
              disabled={!isAdmin}
              value={threshold.cpu}
              onChange={(e) =>
                changeThreshold("cpu", e.target.value)
              }
              className="mt-1 w-full rounded border border-gray-500/50 bg-transparent p-2 disabled:opacity-50"
            />
          </label>

          <label className="block text-sm">
            RAM (%)
            <input
              type="number"
              disabled={!isAdmin}
              value={threshold.ram}
              onChange={(e) =>
                changeThreshold("ram", e.target.value)
              }
              className="mt-1 w-full rounded border border-gray-500/50 bg-transparent p-2 disabled:opacity-50"
            />
          </label>

          <label className="block text-sm">
            Mất kết nối sau (giây)
            <input
              type="number"
              disabled={!isAdmin}
              value={threshold.offlineSeconds}
              onChange={(e) =>
                changeThreshold("offlineSeconds", e.target.value)
              }
              className="mt-1 w-full rounded border border-gray-500/50 bg-transparent p-2 disabled:opacity-50"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3">
          <button
            onClick={saveThreshold}
            disabled={!isAdmin}
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            Lưu ngưỡng
          </button>

          {!isAdmin && (
            <span className="text-sm opacity-70">
              Chỉ quản trị viên (ADMIN) được sửa ngưỡng
            </span>
          )}

          {message && (
            <span className="text-sm">{message}</span>
          )}
        </div>
      </div>

      {/* Danh sách cảnh báo */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-bold">Danh sách cảnh báo</h2>

          <span className="text-sm opacity-70">
            {openCount} chưa xử lý
          </span>

          <div className="flex gap-2">
            {TABS.map((item) => (
              <button
                key={item.value}
                onClick={() => setTab(item.value)}
                className={`rounded px-3 py-1 text-sm ${
                  tab === item.value
                    ? "bg-blue-600 text-white"
                    : "border border-gray-500/50"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto rounded-lg border border-gray-500/30">
          <table className="w-full text-left">
            <thead className="bg-gray-500/10">
              <tr>
                <th className="p-3">Mức độ</th>
                <th className="p-3">Máy chủ</th>
                <th className="p-3">Nội dung</th>
                <th className="p-3">Thời gian</th>
                <th className="p-3">Trạng thái</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-6 text-center opacity-70"
                  >
                    Đang tải cảnh báo...
                  </td>
                </tr>
              ) : (
                list.map((item) => (
                  <tr
                    key={item.id}
                    className="border-t border-gray-500/30"
                  >
                    <td className="p-3">
                      <span
                        className={`rounded px-2 py-1 text-sm ${LEVEL_STYLE[item.level]}`}
                      >
                        {item.level}
                      </span>
                    </td>

                    <td className="p-3">
                      <Link
                        href={`/servers/${item.serverId}`}
                        className="text-blue-500 hover:underline"
                      >
                        {item.serverName}
                      </Link>
                    </td>

                    <td className="p-3">{item.message}</td>

                    <td className="p-3 text-sm opacity-70">
                      {item.time}
                    </td>

                    <td className="p-3">
                      {item.resolved ? (
                        <span className="text-sm text-green-500">
                          Đã xử lý
                        </span>
                      ) : canResolve ? (
                        <button
                          onClick={() => resolve(item.id)}
                          disabled={resolvingId === item.id}
                          className="rounded border border-gray-500/50 px-2 py-1 text-sm hover:bg-gray-500/20 disabled:opacity-50"
                        >
                          {resolvingId === item.id
                            ? "Đang xử lý..."
                            : "Đánh dấu đã xử lý"}
                        </button>
                      ) : (
                        <span className="text-sm opacity-70">
                          Chưa xử lý
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}

              {!loading && list.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="p-6 text-center opacity-70"
                  >
                    Không có cảnh báo
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
