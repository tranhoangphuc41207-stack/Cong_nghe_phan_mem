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
    <div className="h-2 w-full rounded bg-gray-500/30">
      <div className={`h-2 rounded ${color}`} style={{ width: `${value}%` }} />
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-500/30 p-4">
      <p className="text-sm opacity-70">{title}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
    </div>
  );
}

export default function DashboardPage() {
  const servers = mockServers;
  const count = (s: ServerStatus) => servers.filter((x) => x.status === s).length;

  // Trung bình CPU, RAM của các máy đang hoạt động
  const active = servers.filter((x) => x.status !== "OFFLINE");
  const avg = (key: "cpu" | "ram") =>
    active.length
      ? Math.round(active.reduce((sum, x) => sum + x[key], 0) / active.length)
      : 0;

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Tổng quan hệ thống</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="Tổng số máy chủ" value={servers.length} />
        <StatCard title="Đang hoạt động" value={count("ONLINE")} />
        <StatCard title="Cảnh báo" value={count("WARNING")} />
        <StatCard title="Mất kết nối" value={count("OFFLINE")} />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-gray-500/30 p-4">
          <p className="mb-2 text-sm opacity-70">CPU trung bình ({avg("cpu")}%)</p>
          <Bar value={avg("cpu")} />
        </div>
        <div className="rounded-lg border border-gray-500/30 p-4">
          <p className="mb-2 text-sm opacity-70">RAM trung bình ({avg("ram")}%)</p>
          <Bar value={avg("ram")} />
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-500/30">
        <table className="w-full text-left">
          <thead className="bg-gray-500/10">
            <tr>
              <th className="p-3">Tên</th>
              <th className="p-3">IP</th>
              <th className="p-3">Vị trí</th>
              <th className="p-3">Trạng thái</th>
              <th className="w-40 p-3">CPU</th>
              <th className="w-40 p-3">RAM</th>
                            <th className="p-3">Mạng</th>
              <th className="p-3">Docker</th>
            </tr>
          </thead>
          <tbody>
            {servers.map((s) => (
              <tr key={s.id} className="border-t border-gray-500/30">
                <td className="p-3 font-medium">{s.name}</td>
                <td className="p-3">{s.ip}</td>
                <td className="p-3">{s.location}</td>
                <td className="p-3">
                  <span className={`rounded px-2 py-1 text-sm ${STATUS_STYLE[s.status]}`}>
                    {s.status}
                  </span>
                </td>
                <td className="p-3">
                  <Bar value={s.cpu} />
                  <span className="text-xs opacity-70">{s.cpu}%</span>
                </td>
                <td className="p-3">
                  <Bar value={s.ram} />
                  <span className="text-xs opacity-70">{s.ram}%</span>
                </td>
                                <td className="p-3">{s.network} Mbps</td>
                <td className="p-3">
                  {s.containers
                    ? `${s.containers.filter((c) => c.status === "RUNNING").length}/${s.containers.length}`
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}