import { ReportItem } from "@/types/report";

// Dữ liệu giả để làm giao diện báo cáo. Khi có API thật (KAN-64) thì thay bằng dữ liệu từ API.
// Chỉ khai báo dữ liệu của từng Node, các cấp Rack, Room, Site được tự cộng dồn lên.

interface NodeSource {
  name: string;
  rack: string;
  cpuCores: number;
  ramGb: number;
  storageTb: number;
  storageUsedTb: number;
  storageGrowthTbPerMonth: number;
  cpuAvg: number;
  cpuPeak: number;
  ramAvg: number;
  ramPeak: number;
  netAvg: number;
  netPeak: number;
  itKw: number;
  overheadKw: number; // phần điện làm mát và hao phí chia cho node này
}

const NODES: NodeSource[] = [
  { name: "srv-web-01", rack: "Rack A1", cpuCores: 32, ramGb: 128, storageTb: 4, storageUsedTb: 1.8, storageGrowthTbPerMonth: 0.1, cpuAvg: 35, cpuPeak: 62, ramAvg: 60, ramPeak: 78, netAvg: 120, netPeak: 340, itKw: 0.45, overheadKw: 0.27 },
  { name: "srv-db-01", rack: "Rack A1", cpuCores: 64, ramGb: 256, storageTb: 20, storageUsedTb: 15.5, storageGrowthTbPerMonth: 0.8, cpuAvg: 72, cpuPeak: 92, ramAvg: 80, ramPeak: 95, netAvg: 80, netPeak: 210, itKw: 0.8, overheadKw: 0.52 },
  { name: "srv-app-02", rack: "Rack A2", cpuCores: 32, ramGb: 128, storageTb: 4, storageUsedTb: 2.2, storageGrowthTbPerMonth: 0.15, cpuAvg: 18, cpuPeak: 40, ramAvg: 35, ramPeak: 60, netAvg: 40, netPeak: 120, itKw: 0.4, overheadKw: 0.3 },
  { name: "srv-cache-01", rack: "Rack A2", cpuCores: 16, ramGb: 64, storageTb: 2, storageUsedTb: 0.9, storageGrowthTbPerMonth: 0.05, cpuAvg: 22, cpuPeak: 48, ramAvg: 45, ramPeak: 70, netAvg: 60, netPeak: 180, itKw: 0.3, overheadKw: 0.17 },
  { name: "srv-mon-01", rack: "Rack B1", cpuCores: 16, ramGb: 64, storageTb: 12, storageUsedTb: 10.8, storageGrowthTbPerMonth: 0.6, cpuAvg: 55, cpuPeak: 80, ramAvg: 70, ramPeak: 85, netAvg: 95, netPeak: 260, itKw: 0.35, overheadKw: 0.4 },
];

const RACK_TO_ROOM: Record<string, string> = {
  "Rack A1": "Room A",
  "Rack A2": "Room A",
  "Rack B1": "Room B",
};

const SITE_NAME = "DC Hồ Chí Minh";

// Gộp nhiều node thành một mục báo cáo (dùng cho Rack, Room, Site)
function aggregate(
  id: string,
  name: string,
  level: ReportItem["level"],
  parentName: string | null,
  list: NodeSource[]
): ReportItem {
  const sum = (f: (n: NodeSource) => number) => list.reduce((s, n) => s + f(n), 0);
  const max = (f: (n: NodeSource) => number) => Math.max(...list.map(f));
  const cores = sum((n) => n.cpuCores);
  const ram = sum((n) => n.ramGb);
  return {
    id,
    name,
    level,
    parentName,
    nodeCount: list.length,
    cpuAvg: Math.round(sum((n) => n.cpuAvg * n.cpuCores) / cores),
    cpuPeak: max((n) => n.cpuPeak),
    ramAvg: Math.round(sum((n) => n.ramAvg * n.ramGb) / ram),
    ramPeak: max((n) => n.ramPeak),
    netAvg: sum((n) => n.netAvg),
    netPeak: sum((n) => n.netPeak),
    cpuCores: cores,
    ramGb: ram,
    storageTb: sum((n) => n.storageTb),
    storageUsedTb: sum((n) => n.storageUsedTb),
    storageGrowthTbPerMonth: sum((n) => n.storageGrowthTbPerMonth),
    itKw: sum((n) => n.itKw),
    facilityKw: sum((n) => n.itKw + n.overheadKw),
  };
}

function buildReportItems(): ReportItem[] {
  const items: ReportItem[] = [];

  items.push(aggregate("site-1", SITE_NAME, "SITE", null, NODES));

  const rooms = Array.from(new Set(Object.values(RACK_TO_ROOM)));
  rooms.forEach((room) => {
    const list = NODES.filter((n) => RACK_TO_ROOM[n.rack] === room);
    items.push(aggregate(`room-${room}`, room, "ROOM", SITE_NAME, list));
  });

  Object.keys(RACK_TO_ROOM).forEach((rack) => {
    const list = NODES.filter((n) => n.rack === rack);
    items.push(aggregate(`rack-${rack}`, rack, "RACK", RACK_TO_ROOM[rack], list));
  });

  NODES.forEach((n) => {
    items.push(aggregate(`node-${n.name}`, n.name, "NODE", n.rack, [n]));
  });

  return items;
}

export const mockReportItems: ReportItem[] = buildReportItems();
