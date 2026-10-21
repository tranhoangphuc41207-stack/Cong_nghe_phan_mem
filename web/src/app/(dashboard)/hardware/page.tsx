"use client";
import { Fragment, useState } from "react";
import { mockHardware, mockMaintenance } from "@/lib/hardware-mock";
import {
  Hardware,
  HardwareStatus,
  HardwareType,
  MaintenanceRecord,
  MaintenanceType,
} from "@/types/hardware";

const TYPE_LABEL: Record<HardwareType, string> = {
  SERVER: "Máy chủ",
  DISK: "Ổ cứng",
  RAM: "RAM",
  NETWORK: "Card mạng",
  PSU: "Nguồn",
};

const STATUS_LABEL: Record<HardwareStatus, string> = {
  ACTIVE: "Đang hoạt động",
  MAINTENANCE: "Đang bảo trì",
  RETIRED: "Ngừng sử dụng",
};

const STATUS_STYLE: Record<HardwareStatus, string> = {
  ACTIVE: "bg-green-100 text-green-700",
  MAINTENANCE: "bg-yellow-100 text-yellow-700",
  RETIRED: "bg-gray-200 text-gray-700",
};

const MAINTENANCE_LABEL: Record<MaintenanceType, string> = {
  PREVENTIVE: "Bảo trì định kỳ",
  REPAIR: "Sửa chữa",
  REPLACE: "Thay thế",
};

// Tình trạng bảo hành tính theo số ngày còn lại
type WarrantyState = "VALID" | "EXPIRING" | "EXPIRED";

const WARRANTY_LABEL: Record<WarrantyState, string> = {
  VALID: "Còn bảo hành",
  EXPIRING: "Sắp hết hạn",
  EXPIRED: "Hết bảo hành",
};

const WARRANTY_STYLE: Record<WarrantyState, string> = {
  VALID: "bg-green-100 text-green-700",
  EXPIRING: "bg-orange-100 text-orange-700",
  EXPIRED: "bg-red-100 text-red-700",
};

const EXPIRING_DAYS = 90; // còn dưới 90 ngày thì coi là sắp hết hạn

// Số ngày còn lại của bảo hành (âm nghĩa là đã hết hạn)
function daysLeft(warrantyEnd: string) {
  const end = new Date(warrantyEnd + "T00:00:00").getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.ceil((end - today.getTime()) / 86400000);
}

function warrantyState(warrantyEnd: string): WarrantyState {
  const d = daysLeft(warrantyEnd);
  if (d < 0) return "EXPIRED";
  if (d <= EXPIRING_DAYS) return "EXPIRING";
  return "VALID";
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

const WARRANTY_FILTERS: (WarrantyState | "ALL")[] = ["ALL", "VALID", "EXPIRING", "EXPIRED"];

export default function HardwarePage() {
  const [records, setRecords] = useState<MaintenanceRecord[]>(mockMaintenance);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<HardwareType | "ALL">("ALL");
  const [warrantyFilter, setWarrantyFilter] = useState<WarrantyState | "ALL">("ALL");
  const [openId, setOpenId] = useState<string | null>(null);

  // Form thêm lịch sử bảo trì
  const [mDate, setMDate] = useState(todayString());
  const [mType, setMType] = useState<MaintenanceType>("PREVENTIVE");
  const [mTech, setMTech] = useState("");
  const [mDesc, setMDesc] = useState("");
  const [error, setError] = useState("");

  const count = (s: WarrantyState) =>
    mockHardware.filter((h) => warrantyState(h.warrantyEnd) === s).length;

  const shown = mockHardware.filter((h) => {
    const keyword = search.trim().toLowerCase();
    const matchSearch =
      keyword === "" ||
      h.name.toLowerCase().includes(keyword) ||
      h.serialNumber.toLowerCase().includes(keyword) ||
      h.serverName.toLowerCase().includes(keyword);
    const matchType = typeFilter === "ALL" || h.type === typeFilter;
    const matchWarranty =
      warrantyFilter === "ALL" || warrantyState(h.warrantyEnd) === warrantyFilter;
    return matchSearch && matchType && matchWarranty;
  });

  function handleOpen(h: Hardware) {
    setOpenId(openId === h.id ? null : h.id);
    setError("");
  }

  function handleAddRecord(hardwareId: string, e: React.FormEvent) {
    e.preventDefault();
    if (!mTech.trim() || !mDesc.trim()) {
      setError("Vui lòng nhập người thực hiện và nội dung bảo trì");
      return;
    }
    const newRecord: MaintenanceRecord = {
      id: `MT-${String(records.length + 1).padStart(3, "0")}`,
      hardwareId,
      date: mDate,
      type: mType,
      technician: mTech.trim(),
      description: mDesc.trim(),
    };
    setRecords((list) => [newRecord, ...list]);
    setMTech("");
    setMDesc("");
    setMType("PREVENTIVE");
    setMDate(todayString());
    setError("");
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Quản lý phần cứng và bảo hành</h1>

      {/* Thống kê */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-lg border border-gray-500/30 p-4">
          <p className="text-sm opacity-70">Tổng thiết bị</p>
          <p className="mt-1 text-3xl font-bold">{mockHardware.length}</p>
        </div>
        {(["VALID", "EXPIRING", "EXPIRED"] as WarrantyState[]).map((s) => (
          <div key={s} className="rounded-lg border border-gray-500/30 p-4">
            <p className="text-sm opacity-70">{WARRANTY_LABEL[s]}</p>
            <p className="mt-1 text-3xl font-bold">{count(s)}</p>
          </div>
        ))}
      </div>

      {/* Tìm kiếm và bộ lọc */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          className="w-72 rounded border border-gray-500/30 bg-transparent p-2"
          placeholder="Tìm theo tên, serial hoặc máy chủ"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <select
          className="rounded border border-gray-500/30 bg-transparent p-2"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as HardwareType | "ALL")}
        >
          <option value="ALL" className="text-gray-900">
            Tất cả loại
          </option>
          {(Object.keys(TYPE_LABEL) as HardwareType[]).map((t) => (
            <option key={t} value={t} className="text-gray-900">
              {TYPE_LABEL[t]}
            </option>
          ))}
        </select>
        {WARRANTY_FILTERS.map((s) => (
          <button
            key={s}
            onClick={() => setWarrantyFilter(s)}
            className={`rounded px-3 py-1 text-sm ${
              warrantyFilter === s ? "bg-blue-600 text-white" : "border border-gray-500/30"
            }`}
          >
            {s === "ALL" ? "Tất cả" : WARRANTY_LABEL[s]}
          </button>
        ))}
      </div>

      {/* Bảng thiết bị */}
      <div className="overflow-x-auto rounded-lg border border-gray-500/30">
        <table className="w-full text-left">
          <thead className="bg-gray-500/10">
            <tr>
              <th className="p-3">Mã</th>
              <th className="p-3">Thiết bị</th>
              <th className="p-3">Loại</th>
              <th className="p-3">Máy chủ</th>
              <th className="p-3">Serial</th>
              <th className="p-3">Hạn bảo hành</th>
              <th className="p-3">Bảo hành</th>
              <th className="p-3">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center opacity-70">
                  Không có thiết bị nào
                </td>
              </tr>
            )}
            {shown.map((h) => {
              const state = warrantyState(h.warrantyEnd);
              const days = daysLeft(h.warrantyEnd);
              const history = records.filter((r) => r.hardwareId === h.id);
              return (
                <Fragment key={h.id}>
                  <tr className="border-t border-gray-500/30">
                    <td className="p-3 font-medium">{h.id}</td>
                    <td className="p-3">
                      <button onClick={() => handleOpen(h)} className="text-left underline">
                        {h.name}
                      </button>
                    </td>
                    <td className="p-3">{TYPE_LABEL[h.type]}</td>
                    <td className="p-3">{h.serverName}</td>
                    <td className="p-3">{h.serialNumber}</td>
                    <td className="p-3">{h.warrantyEnd}</td>
                    <td className="p-3">
                      <span className={`rounded px-2 py-1 text-sm ${WARRANTY_STYLE[state]}`}>
                        {WARRANTY_LABEL[state]}
                      </span>
                      <p className="mt-1 text-xs opacity-70">
                        {days >= 0 ? `Còn ${days} ngày` : `Quá hạn ${-days} ngày`}
                      </p>
                    </td>
                    <td className="p-3">
                      <span className={`rounded px-2 py-1 text-sm ${STATUS_STYLE[h.status]}`}>
                        {STATUS_LABEL[h.status]}
                      </span>
                    </td>
                  </tr>

                  {openId === h.id && (
                    <tr className="bg-gray-500/10">
                      <td colSpan={8} className="space-y-4 p-4 text-sm">
                        <div className="grid gap-1 md:grid-cols-3">
                          <p><b>Hãng:</b> {h.vendor}</p>
                          <p><b>Model:</b> {h.model}</p>
                          <p><b>Ngày mua:</b> {h.purchaseDate}</p>
                        </div>

                        <div>
                          <h3 className="mb-2 font-bold">
                            Lịch sử bảo trì ({history.length})
                          </h3>
                          {history.length === 0 ? (
                            <p className="opacity-70">Chưa có lịch sử bảo trì</p>
                          ) : (
                            <ul className="space-y-2">
                              {history.map((r) => (
                                <li
                                  key={r.id}
                                  className="rounded border border-gray-500/30 p-3"
                                >
                                  <p>
                                    <b>{r.date}</b> · {MAINTENANCE_LABEL[r.type]} · {r.technician}
                                  </p>
                                  <p className="opacity-80">{r.description}</p>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>

                        {/* Form thêm lịch sử bảo trì */}
                        <form
                          onSubmit={(e) => handleAddRecord(h.id, e)}
                          className="space-y-2 rounded border border-gray-500/30 p-3"
                        >
                          <h3 className="font-bold">Thêm lịch sử bảo trì</h3>
                          <div className="grid gap-2 md:grid-cols-3">
                            <input
                              type="date"
                              className="rounded border border-gray-500/30 bg-transparent p-2"
                              value={mDate}
                              onChange={(e) => setMDate(e.target.value)}
                            />
                            <select
                              className="rounded border border-gray-500/30 bg-transparent p-2"
                              value={mType}
                              onChange={(e) => setMType(e.target.value as MaintenanceType)}
                            >
                              {(Object.keys(MAINTENANCE_LABEL) as MaintenanceType[]).map((t) => (
                                <option key={t} value={t} className="text-gray-900">
                                  {MAINTENANCE_LABEL[t]}
                                </option>
                              ))}
                            </select>
                            <input
                              className="rounded border border-gray-500/30 bg-transparent p-2"
                              placeholder="Người thực hiện"
                              value={mTech}
                              onChange={(e) => setMTech(e.target.value)}
                            />
                          </div>
                          <textarea
                            className="w-full rounded border border-gray-500/30 bg-transparent p-2"
                            rows={2}
                            placeholder="Nội dung bảo trì"
                            value={mDesc}
                            onChange={(e) => setMDesc(e.target.value)}
                          />
                          {error && <p className="text-red-600">{error}</p>}
                          <button className="rounded bg-blue-600 px-4 py-2 text-white">
                            Lưu lịch sử
                          </button>
                        </form>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
