import Link from "next/link";
import { mockServers } from "@/lib/dashboard-mock";
import { mockRooms } from "@/lib/infra-mock";
import { ServerStatus } from "@/types";

const SLOT_COUNT = 4; // số vị trí mỗi rack

const SLOT_STYLE: Record<ServerStatus, string> = {
  ONLINE: "border-green-500 bg-green-500/20",
  WARNING: "border-yellow-500 bg-yellow-500/20",
  OFFLINE: "border-red-500 bg-red-500/20",
};

function Rack({ name }: { name: string }) {
  const servers = mockServers.filter((s) => s.location === name);
  const empty = Math.max(0, SLOT_COUNT - servers.length);

  return (
    <div className="rounded-lg border border-gray-500/30 p-3">
      <div className="mb-3 flex justify-between">
        <span className="font-bold">{name}</span>
        <span className="text-sm opacity-70">
          {servers.length}/{SLOT_COUNT} vị trí
        </span>
      </div>
      <div className="space-y-2">
        {servers.map((s) => (
          <Link
            key={s.id}
            href={`/servers/${s.id}`}
            className={`flex items-center justify-between rounded border px-3 py-2 hover:opacity-80 ${SLOT_STYLE[s.status]}`}
          >
            <span className="font-medium">{s.name}</span>
            <span className="text-xs">{s.status}</span>
          </Link>
        ))}
        {Array.from({ length: empty }).map((_, i) => (
          <div
            key={`empty-${i}`}
            className="rounded border border-dashed border-gray-500/40 px-3 py-2 text-sm opacity-50"
          >
            Trống
          </div>
        ))}
      </div>
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

export default function InfrastructurePage() {
  const rackCount = mockRooms.reduce((sum, r) => sum + r.racks.length, 0);

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Hạ tầng và sơ đồ phòng máy</h1>

      <div className="grid grid-cols-3 gap-4">
        <StatCard title="Phòng máy" value={mockRooms.length} />
        <StatCard title="Giá rack" value={rackCount} />
        <StatCard title="Máy chủ" value={mockServers.length} />
      </div>

      <div className="flex gap-4 text-sm">
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded border border-green-500 bg-green-500/20" />
          Hoạt động
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded border border-yellow-500 bg-yellow-500/20" />
          Cảnh báo
        </span>
        <span className="flex items-center gap-2">
          <span className="h-3 w-3 rounded border border-red-500 bg-red-500/20" />
          Mất kết nối
        </span>
      </div>

      {mockRooms.map((room) => (
        <section key={room.id} className="space-y-3">
          <h2 className="text-lg font-bold">{room.name}</h2>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {room.racks.map((rack) => (
              <Rack key={rack} name={rack} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}