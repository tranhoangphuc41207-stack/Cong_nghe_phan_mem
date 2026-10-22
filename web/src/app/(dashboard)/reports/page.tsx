"use client";
import { useState } from "react";
import { mockReportItems } from "@/lib/report-mock";
import { ReportItem, ReportLevel } from "@/types/report";

type ReportTab = "MONITOR" | "CAPACITY" | "POWER";

const LEVEL_LABEL: Record<ReportLevel, string> = {
  SITE: "Site",
  ROOM: "Room",
  RACK: "Rack",
  NODE: "Node",
};

const TAB_LABEL: Record<ReportTab, string> = {
  MONITOR: "Giám sát",
  CAPACITY: "Capacity planning",
  POWER: "PUE và điện năng",
};

const LEVELS: ReportLevel[] = ["SITE", "ROOM", "RACK", "NODE"];
const TABS: ReportTab[] = ["MONITOR", "CAPACITY", "POWER"];

const BADGE_GOOD = "bg-green-100 text-green-700";
const BADGE_WARN = "bg-orange-100 text-orange-700";
const BADGE_BAD = "bg-red-100 text-red-700";

// ----- Các hàm tính toán -----

// Màu theo mức sử dụng (%)
function usageStyle(percent: number) {
  if (percent >= 90) return BADGE_BAD;
  if (percent >= 80) return BADGE_WARN;
  return BADGE_GOOD;
}

function storagePercent(i: ReportItem) {
  return Math.round((i.storageUsedTb / i.storageTb) * 100);
}

// Số ngày nữa thì đầy ổ cứng (null nếu không tăng)
function daysToFull(i: ReportItem) {
  if (i.storageGrowthTbPerMonth <= 0) return null;
  const free = i.storageTb - i.storageUsedTb;
  return Math.floor(free / (i.storageGrowthTbPerMonth / 30));
}

function formatFullDate(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toLocaleDateString("vi-VN");
}

// Đánh giá capacity: khẩn cấp, cần lên kế hoạch hoặc ổn định
function capacityState(i: ReportItem): { label: string; style: string } {
  const days = daysToFull(i);
  const worstPeak = Math.max(i.cpuPeak, i.ramPeak, storagePercent(i));
  if ((days !== null && days < 90) || worstPeak >= 90) {
    return { label: "Khẩn cấp", style: BADGE_BAD };
  }
  if ((days !== null && days < 180) || worstPeak >= 80) {
    return { label: "Cần lên kế hoạch", style: BADGE_WARN };
  }
  return { label: "Ổn định", style: BADGE_GOOD };
}

function pue(i: ReportItem) {
  return i.facilityKw / i.itKw;
}

function pueState(value: number): { label: string; style: string } {
  if (value < 1.5) return { label: "Tốt", style: BADGE_GOOD };
  if (value < 1.8) return { label: "Trung bình", style: BADGE_WARN };
  return { label: "Cao", style: BADGE_BAD };
}

// Điện năng 7 ngày gần nhất (giả lập, có dao động nhẹ mỗi ngày)
function energySeries(i: ReportItem) {
  const seed = i.name.length;
  return Array.from({ length: 7 }, (_, idx) => {
    const factor = 1 + 0.06 * Math.sin(idx * 1.7 + seed);
    const date = new Date();
    date.setDate(date.getDate() - (6 - idx));
    return {
      label: `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`,
      itKwh: i.itKw * 24 * factor,
      facilityKwh: i.facilityKw * 24 * factor,
    };
  });
}

function downloadCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows
    .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\r\n");
  // Thêm BOM để Excel đọc đúng tiếng Việt
  const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function Card({ title, value, note }: { title: string; value: string; note?: string }) {
  return (
    <div className="rounded-lg border border-gray-500/30 p-4">
      <p className="text-sm opacity-70">{title}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
      {note && <p className="mt-1 text-xs opacity-70">{note}</p>}
    </div>
  );
}

export default function ReportsPage() {
  const [tab, setTab] = useState<ReportTab>("MONITOR");
  const [level, setLevel] = useState<ReportLevel>("SITE");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const site = mockReportItems.find((i) => i.level === "SITE")!;
  const items = mockReportItems.filter((i) => i.level === level);
  const selected = items.find((i) => i.id === selectedId) ?? items[0];
  const urgent = mockReportItems.filter(
    (i) => i.level === "NODE" && capacityState(i).label !== "Ổn định"
  ).length;

  function handleLevel(l: ReportLevel) {
    setLevel(l);
    setSelectedId(null);
  }

  function handleExport() {
    const name = `bao-cao-${tab.toLowerCase()}-${level.toLowerCase()}.csv`;
    let rows: (string | number)[][] = [];
    if (tab === "MONITOR") {
      rows = [
        ["Tên", "Thuộc", "CPU TB (%)", "CPU đỉnh (%)", "RAM TB (%)", "RAM đỉnh (%)", "Network TB (Mbps)", "Network đỉnh (Mbps)"],
        ...items.map((i) => [i.name, i.parentName ?? "", i.cpuAvg, i.cpuPeak, i.ramAvg, i.ramPeak, i.netAvg, i.netPeak]),
      ];
    } else if (tab === "CAPACITY") {
      rows = [
        ["Tên", "CPU đỉnh (%)", "RAM đỉnh (%)", "Storage đã dùng (TB)", "Storage tổng (TB)", "Storage (%)", "Tăng mỗi tháng (TB)", "Số ngày đến khi đầy", "Đánh giá"],
        ...items.map((i) => [i.name, i.cpuPeak, i.ramPeak, i.storageUsedTb.toFixed(1), i.storageTb, storagePercent(i), i.storageGrowthTbPerMonth.toFixed(2), daysToFull(i) ?? "", capacityState(i).label]),
      ];
    } else {
      rows = [
        ["Tên", "Công suất IT (kW)", "Tổng công suất (kW)", "PUE", "Điện năng mỗi ngày (kWh)", "Đánh giá PUE"],
        ...items.map((i) => [i.name, i.itKw.toFixed(2), i.facilityKw.toFixed(2), pue(i).toFixed(2), (i.facilityKw * 24).toFixed(1), pueState(pue(i)).label]),
      ];
    }
    downloadCsv(name, rows);
  }

  // Biểu đồ điện năng 7 ngày của mục đang chọn
  const series = selected ? energySeries(selected) : [];
  const maxKwh = Math.max(1, ...series.map((s) => s.facilityKwh));

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Báo cáo giám sát và vận hành</h1>
        <button onClick={handleExport} className="rounded bg-blue-600 px-4 py-2 text-white">
          Xuất CSV
        </button>
      </div>
      <p className="text-sm opacity-70">
        Số liệu 7 ngày gần nhất của {site.name} ({site.nodeCount} node). Dữ liệu hiện là dữ liệu giả.
      </p>

      {/* Thẻ tổng quan theo từng loại báo cáo */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {tab === "MONITOR" && (
          <>
            <Card title="CPU trung bình" value={`${site.cpuAvg}%`} note={`Đỉnh ${site.cpuPeak}%`} />
            <Card title="RAM trung bình" value={`${site.ramAvg}%`} note={`Đỉnh ${site.ramPeak}%`} />
            <Card title="Network trung bình" value={`${site.netAvg} Mbps`} note={`Đỉnh ${site.netPeak} Mbps`} />
            <Card title="Số node" value={String(site.nodeCount)} />
          </>
        )}
        {tab === "CAPACITY" && (
          <>
            <Card title="CPU đỉnh" value={`${site.cpuPeak}%`} note={`${site.cpuCores} core`} />
            <Card title="RAM đỉnh" value={`${site.ramPeak}%`} note={`${site.ramGb} GB`} />
            <Card
              title="Storage đã dùng"
              value={`${storagePercent(site)}%`}
              note={`${site.storageUsedTb.toFixed(1)} / ${site.storageTb} TB`}
            />
            <Card title="Node cần chú ý" value={String(urgent)} note="Cần lên kế hoạch hoặc khẩn cấp" />
          </>
        )}
        {tab === "POWER" && (
          <>
            <Card title="PUE toàn site" value={pue(site).toFixed(2)} note={pueState(pue(site)).label} />
            <Card title="Công suất IT" value={`${site.itKw.toFixed(2)} kW`} />
            <Card title="Tổng công suất" value={`${site.facilityKw.toFixed(2)} kW`} />
            <Card title="Điện năng mỗi ngày" value={`${(site.facilityKw * 24).toFixed(0)} kWh`} />
          </>
        )}
      </div>

      {/* Chọn loại báo cáo và phạm vi */}
      <div className="flex flex-wrap items-center gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`rounded px-3 py-1 text-sm ${tab === t ? "bg-blue-600 text-white" : "border border-gray-500/30"}`}
          >
            {TAB_LABEL[t]}
          </button>
        ))}
        <span className="mx-2 opacity-40">|</span>
        <span className="text-sm opacity-70">Phạm vi:</span>
        {LEVELS.map((l) => (
          <button
            key={l}
            onClick={() => handleLevel(l)}
            className={`rounded px-3 py-1 text-sm ${level === l ? "bg-blue-600 text-white" : "border border-gray-500/30"}`}
          >
            {LEVEL_LABEL[l]}
          </button>
        ))}
      </div>

      {/* Bảng báo cáo */}
      <div className="overflow-x-auto rounded-lg border border-gray-500/30">
        <table className="w-full text-left">
          <thead className="bg-gray-500/10">
            {tab === "MONITOR" && (
              <tr>
                <th className="p-3">{LEVEL_LABEL[level]}</th>
                <th className="p-3">Thuộc</th>
                <th className="p-3">CPU TB</th>
                <th className="p-3">CPU đỉnh</th>
                <th className="p-3">RAM TB</th>
                <th className="p-3">RAM đỉnh</th>
                <th className="p-3">Network TB</th>
                <th className="p-3">Network đỉnh</th>
              </tr>
            )}
            {tab === "CAPACITY" && (
              <tr>
                <th className="p-3">{LEVEL_LABEL[level]}</th>
                <th className="p-3">CPU đỉnh</th>
                <th className="p-3">RAM đỉnh</th>
                <th className="p-3">Storage</th>
                <th className="p-3">Tăng mỗi tháng</th>
                <th className="p-3">Dự kiến đầy</th>
                <th className="p-3">Đánh giá</th>
              </tr>
            )}
            {tab === "POWER" && (
              <tr>
                <th className="p-3">{LEVEL_LABEL[level]}</th>
                <th className="p-3">Công suất IT</th>
                <th className="p-3">Tổng công suất</th>
                <th className="p-3">PUE</th>
                <th className="p-3">Điện năng mỗi ngày</th>
                <th className="p-3">Đánh giá</th>
              </tr>
            )}
          </thead>
          <tbody>
            {items.map((i) => {
              const days = daysToFull(i);
              const cap = capacityState(i);
              const p = pue(i);
              const ps = pueState(p);
              const isSelected = tab === "POWER" && selected?.id === i.id;
              return (
                <tr
                  key={i.id}
                  onClick={() => setSelectedId(i.id)}
                  className={`border-t border-gray-500/30 ${tab === "POWER" ? "cursor-pointer" : ""} ${isSelected ? "bg-gray-500/10" : ""}`}
                >
                  <td className="p-3 font-medium">{i.name}</td>

                  {tab === "MONITOR" && (
                    <>
                      <td className="p-3">{i.parentName ?? "—"}</td>
                      <td className="p-3">{i.cpuAvg}%</td>
                      <td className="p-3">{i.cpuPeak}%</td>
                      <td className="p-3">{i.ramAvg}%</td>
                      <td className="p-3">{i.ramPeak}%</td>
                      <td className="p-3">{i.netAvg} Mbps</td>
                      <td className="p-3">{i.netPeak} Mbps</td>
                    </>
                  )}

                  {tab === "CAPACITY" && (
                    <>
                      <td className="p-3">
                        <span className={`rounded px-2 py-1 text-sm ${usageStyle(i.cpuPeak)}`}>{i.cpuPeak}%</span>
                      </td>
                      <td className="p-3">
                        <span className={`rounded px-2 py-1 text-sm ${usageStyle(i.ramPeak)}`}>{i.ramPeak}%</span>
                      </td>
                      <td className="p-3">
                        <span className={`rounded px-2 py-1 text-sm ${usageStyle(storagePercent(i))}`}>
                          {storagePercent(i)}%
                        </span>
                        <p className="mt-1 text-xs opacity-70">
                          {i.storageUsedTb.toFixed(1)} / {i.storageTb} TB
                        </p>
                      </td>
                      <td className="p-3">{i.storageGrowthTbPerMonth.toFixed(2)} TB</td>
                      <td className="p-3">
                        {days === null ? (
                          "Không tăng"
                        ) : (
                          <>
                            {days} ngày
                            <p className="mt-1 text-xs opacity-70">{formatFullDate(days)}</p>
                          </>
                        )}
                      </td>
                      <td className="p-3">
                        <span className={`rounded px-2 py-1 text-sm ${cap.style}`}>{cap.label}</span>
                      </td>
                    </>
                  )}

                  {tab === "POWER" && (
                    <>
                      <td className="p-3">{i.itKw.toFixed(2)} kW</td>
                      <td className="p-3">{i.facilityKw.toFixed(2)} kW</td>
                      <td className="p-3 font-bold">{p.toFixed(2)}</td>
                      <td className="p-3">{(i.facilityKw * 24).toFixed(1)} kWh</td>
                      <td className="p-3">
                        <span className={`rounded px-2 py-1 text-sm ${ps.style}`}>{ps.label}</span>
                      </td>
                    </>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Biểu đồ điện năng 7 ngày */}
      {tab === "POWER" && selected && (
        <div className="space-y-3 rounded-lg border border-gray-500/30 p-4">
          <h2 className="font-bold">
            Điện năng 7 ngày gần nhất: {selected.name}
          </h2>
          <p className="text-sm opacity-70">
            Bấm vào một dòng trong bảng để xem biểu đồ của {LEVEL_LABEL[level]} khác.
          </p>
          <div className="flex h-48 items-end gap-3">
            {series.map((s) => {
              const total = (s.facilityKwh / maxKwh) * 100;
              const itPart = (s.itKwh / s.facilityKwh) * 100;
              return (
                <div key={s.label} className="flex h-full flex-1 flex-col items-center justify-end text-xs">
                  <span className="mb-1">{s.facilityKwh.toFixed(0)}</span>
                  <div
                    className="flex w-full flex-col justify-end overflow-hidden rounded-t bg-gray-400"
                    style={{ height: `${total}%` }}
                  >
                    <div className="w-full bg-blue-500" style={{ height: `${itPart}%` }} />
                  </div>
                  <span className="mt-1 opacity-70">{s.label}</span>
                </div>
              );
            })}
          </div>
          <div className="flex gap-4 text-sm">
            <span><span className="mr-1 inline-block h-3 w-3 bg-blue-500" />Thiết bị IT</span>
            <span><span className="mr-1 inline-block h-3 w-3 bg-gray-400" />Làm mát và hao phí</span>
            <span className="opacity-70">Đơn vị: kWh mỗi ngày</span>
          </div>
        </div>
      )}
    </div>
  );
}
