"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { getUser } from "@/lib/auth";
import { defaultThreshold, mockAlerts } from "@/lib/alerts-mock";
import { Alert, AlertLevel, Threshold } from "@/types";

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

export default function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>(mockAlerts);
  const [tab, setTab] = useState<Tab>("ALL");
  const [threshold, setThreshold] = useState<Threshold>(defaultThreshold);
  const [isAdmin, setIsAdmin] = useState(false);
  const [message, setMessage] = useState("");

  // Chỉ ADMIN được sửa ngưỡng
  useEffect(() => {
    setIsAdmin(getUser()?.role === "ADMIN");
  }, []);

  const list = alerts.filter(
    (a) => tab === "ALL" || (tab === "OPEN" ? !a.resolved : a.resolved)
  );
  const openCount = alerts.filter((a) => !a.resolved).length;

  function resolve(id: string) {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, resolved: true } : a))
    );
  }

  function changeThreshold(key: keyof Threshold, value: string) {
    setMessage("");
    setThreshold((prev) => ({ ...prev, [key]: Number(value) }));
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
    setMessage("Đã lưu ngưỡng cảnh báo (dữ liệu giả, chưa gửi lên máy chủ)");
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Cảnh báo</h1>

      <div className="rounded-lg border border-gray-500/30 p-4">
        <h2 className="mb-3 font-bold">Ngưỡng cảnh báo</h2>
        <div className="grid gap-4 md:grid-cols-3">
          <label className="block text-sm">
            CPU (%)
            <input
              type="number"
              disabled={!isAdmin}
              value={threshold.cpu}
              onChange={(e) => changeThreshold("cpu", e.target.value)}
              className="mt-1 w-full rounded border border-gray-500/50 bg-transparent p-2 disabled:opacity-50"
            />
          </label>
          <label className="block text-sm">
            RAM (%)
            <input
              type="number"
              disabled={!isAdmin}
              value={threshold.ram}
              onChange={(e) => changeThreshold("ram", e.target.value)}
              className="mt-1 w-full rounded border border-gray-500/50 bg-transparent p-2 disabled:opacity-50"
            />
          </label>
          <label className="block text-sm">
            Mất kết nối sau (giây)
            <input
              type="number"
              disabled={!isAdmin}
              value={threshold.offlineSeconds}
              onChange={(e) => changeThreshold("offlineSeconds", e.target.value)}
              className="mt-1 w-full rounded border border-gray-500/50 bg-transparent p-2 disabled:opacity-50"
            />
          </label>
        </div>
        <div className="mt-4 flex items-center gap-3">
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
          {message && <span className="text-sm">{message}</span>}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-bold">Danh sách cảnh báo</h2>
          <span className="text-sm opacity-70">{openCount} chưa xử lý</span>
          <div className="flex gap-2">
            {TABS.map((t) => (
              <button
                key={t.value}
                onClick={() => setTab(t.value)}
                className={`rounded px-3 py-1 text-sm ${
                  tab === t.value
                    ? "bg-blue-600 text-white"
                    : "border border-gray-500/50"
                }`}
              >
                {t.label}
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
              {list.map((a) => (
                <tr key={a.id} className="border-t border-gray-500/30">
                  <td className="p-3">
                    <span
                      className={`rounded px-2 py-1 text-sm ${LEVEL_STYLE[a.level]}`}
                    >
                      {a.level}
                    </span>
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/servers/${a.serverId}`}
                      className="text-blue-500 hover:underline"
                    >
                      {a.serverName}
                    </Link>
                  </td>
                  <td className="p-3">{a.message}</td>
                  <td className="p-3 text-sm opacity-70">{a.time}</td>
                  <td className="p-3">
                    {a.resolved ? (
                      <span className="text-sm text-green-500">Đã xử lý</span>
                    ) : (
                      <button
                        onClick={() => resolve(a.id)}
                        className="rounded border border-gray-500/50 px-2 py-1 text-sm hover:bg-gray-500/20"
                      >
                        Đánh dấu đã xử lý
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {list.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center opacity-70">
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