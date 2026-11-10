"use client";
import Link from "next/link";
import { useParams } from "next/navigation";
import { mockServers } from "@/lib/dashboard-mock";
import { ServerStatus } from "@/types";

const STATUS_STYLE: Record<ServerStatus, string> = {
  ONLINE: "bg-green-100 text-green-700",
  WARNING: "bg-yellow-100 text-yellow-700",
  OFFLINE: "bg-red-100 text-red-700",
};

// Thanh phần trăm: xanh bình thường, vàng từ 70%, đỏ từ 85%
function Bar({ value }: { value: number }) {
  const color =
    value >= 85 ? "bg-red-500" : value >= 70 ? "bg-yellow-500" : "bg-green-500";
  return (
    <div className="h-3 w-full rounded bg-gray-500/30">
      <div className={`h-3 rounded ${color}`} style={{ width: `${value}%` }} />
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-500/30 p-4">
      <div className="mb-2 flex justify-between">
        <span className="text-sm opacity-70">{label}</span>
        <span className="font-bold">{value}%</span>
      </div>
      <Bar value={value} />
    </div>
  );
}

// Lịch sử cảnh báo giả để làm giao diện
const MOCK_ALERTS = [
  { id: 1, time: "21/10/2026 07:40", message: "CPU vượt ngưỡng 85%" },
  { id: 2, time: "21/10/2026 07:12", message: "RAM vượt ngưỡng 90%" },
  { id: 3, time: "20/10/2026 22:05", message: "Mất kết nối quá 90 giây" },
];

export default function ServerDetailPage() {
  const params = useParams<{ id: string }>();
  const server = mockServers.find((s) => s.id === params.id);

  if (!server) {
    return (
      <div className="space-y-4 p-6">
        <p>Không tìm thấy máy chủ có mã {params.id}.</p>
        <Link href="/servers" className="text-blue-500 hover:underline">
          ← Quay lại danh sách
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <Link href="/servers" className="text-blue-500 hover:underline">
        ← Quay lại danh sách
      </Link>

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{server.name}</h1>
        <span
          className={`rounded px-2 py-1 text-sm ${STATUS_STYLE[server.status]}`}
        >
          {server.status}
        </span>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-gray-500/30 p-4">
          <p className="text-sm opacity-70">Địa chỉ IP</p>
          <p className="mt-1 font-medium">{server.ip}</p>
        </div>
        <div className="rounded-lg border border-gray-500/30 p-4">
          <p className="text-sm opacity-70">Vị trí</p>
          <p className="mt-1 font-medium">{server.location}</p>
        </div>
        <div className="rounded-lg border border-gray-500/30 p-4">
          <p className="text-sm opacity-70">Mạng</p>
          <p className="mt-1 font-medium">{server.network} Mbps</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Metric label="CPU" value={server.cpu} />
        <Metric label="RAM" value={server.ram} />
      </div>

            <div className="rounded-lg border border-gray-500/30">
        <h2 className="border-b border-gray-500/30 p-3 font-bold">
          Docker container
        </h2>
        {server.containers && server.containers.length > 0 ? (
          <ul>
            {server.containers.map((c) => (
              <li
                key={c.name}
                className="flex items-center justify-between border-b border-gray-500/30 p-3 last:border-b-0"
              >
                <div>
                  <p className="font-medium">{c.name}</p>
                  <p className="text-sm opacity-70">{c.image}</p>
                </div>
                <span
                  className={`rounded px-2 py-1 text-sm ${
                    c.status === "RUNNING"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {c.status === "RUNNING" ? "Đang chạy" : "Đã dừng"}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="p-3 opacity-70">Không có container</p>
        )}
      </div>
      <div className="rounded-lg border border-gray-500/30">
        <h2 className="border-b border-gray-500/30 p-3 font-bold">
          Lịch sử cảnh báo
        </h2>
        <ul>
          {MOCK_ALERTS.map((a) => (
            <li
              key={a.id}
              className="flex justify-between border-b border-gray-500/30 p-3 last:border-b-0"
            >
              <span>{a.message}</span>
              <span className="text-sm opacity-70">{a.time}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}