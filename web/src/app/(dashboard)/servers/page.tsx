"use client";
import { useState } from "react";
import Link from "next/link";
import { mockServers } from "@/lib/dashboard-mock";
import { ServerStatus } from "@/types";

const STATUS_STYLE: Record<ServerStatus, string> = {
  ONLINE: "bg-green-100 text-green-700",
  WARNING: "bg-yellow-100 text-yellow-700",
  OFFLINE: "bg-red-100 text-red-700",
};

type Filter = "ALL" | ServerStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "ALL", label: "Tất cả" },
  { value: "ONLINE", label: "Hoạt động" },
  { value: "WARNING", label: "Cảnh báo" },
  { value: "OFFLINE", label: "Mất kết nối" },
];

export default function ServersPage() {
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");

  // Lọc theo trạng thái và từ khóa (tên, IP, vị trí)
  const kw = keyword.trim().toLowerCase();
  const list = mockServers.filter((s) => {
    const okStatus = filter === "ALL" || s.status === filter;
    const okKeyword =
      !kw ||
      s.name.toLowerCase().includes(kw) ||
      s.ip.includes(kw) ||
      s.location.toLowerCase().includes(kw);
    return okStatus && okKeyword;
  });

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">Danh sách máy chủ</h1>

      <div className="flex flex-wrap items-center gap-3">
        <input
          className="w-72 rounded border border-gray-500/50 bg-transparent p-2"
          placeholder="Tìm theo tên, IP, vị trí..."
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
        />
        <div className="flex gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={`rounded px-3 py-1 text-sm ${
                filter === f.value
                  ? "bg-blue-600 text-white"
                  : "border border-gray-500/50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm opacity-70">
        Hiển thị {list.length} / {mockServers.length} máy chủ
      </p>

      <div className="overflow-x-auto rounded-lg border border-gray-500/30">
        <table className="w-full text-left">
          <thead className="bg-gray-500/10">
            <tr>
              <th className="p-3">Tên</th>
              <th className="p-3">IP</th>
              <th className="p-3">Vị trí</th>
              <th className="p-3">Trạng thái</th>
              <th className="p-3">CPU</th>
              <th className="p-3">RAM</th>
              <th className="p-3">Mạng (Mbps)</th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id} className="border-t border-gray-500/30">
                <td className="p-3">
                  <Link
                    href={`/servers/${s.id}`}
                    className="font-medium text-blue-500 hover:underline"
                  >
                    {s.name}
                  </Link>
                </td>
                <td className="p-3">{s.ip}</td>
                <td className="p-3">{s.location}</td>
                <td className="p-3">
                  <span
                    className={`rounded px-2 py-1 text-sm ${STATUS_STYLE[s.status]}`}
                  >
                    {s.status}
                  </span>
                </td>
                <td className="p-3">{s.cpu}%</td>
                <td className="p-3">{s.ram}%</td>
                <td className="p-3">{s.network}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center opacity-70">
                  Không tìm thấy máy chủ phù hợp
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}