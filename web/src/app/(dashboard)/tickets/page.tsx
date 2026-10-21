"use client";
import { Fragment, useEffect, useState } from "react";
import { getUser } from "@/lib/auth";
import { mockServers } from "@/lib/dashboard-mock";
import { mockTechnicians, mockTickets } from "@/lib/ticket-mock";
import { Ticket, TicketPriority, TicketStatus } from "@/types";

const STATUS_LABEL: Record<TicketStatus, string> = {
  OPEN: "Mới tạo",
  IN_PROGRESS: "Đang xử lý",
  RESOLVED: "Đã xử lý",
  CLOSED: "Đã đóng",
};

const STATUS_STYLE: Record<TicketStatus, string> = {
  OPEN: "bg-blue-100 text-blue-700",
  IN_PROGRESS: "bg-yellow-100 text-yellow-700",
  RESOLVED: "bg-green-100 text-green-700",
  CLOSED: "bg-gray-200 text-gray-700",
};

const PRIORITY_STYLE: Record<TicketPriority, string> = {
  LOW: "bg-gray-200 text-gray-700",
  MEDIUM: "bg-blue-100 text-blue-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700",
};

const STATUSES: TicketStatus[] = ["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"];
const PRIORITIES: TicketPriority[] = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];

// Ngày giờ hiện tại dạng "2026-10-20 09:30"
function now() {
  return new Date().toISOString().slice(0, 16).replace("T", " ");
}

export default function TicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>(mockTickets);
  const [filter, setFilter] = useState<TicketStatus | "ALL">("ALL");
  const [openId, setOpenId] = useState<string | null>(null); // ticket đang mở chi tiết
  const [showForm, setShowForm] = useState(false);
  const [username, setUsername] = useState("");

  // Form tạo ticket
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [serverId, setServerId] = useState(mockServers[0].id);
  const [priority, setPriority] = useState<TicketPriority>("MEDIUM");
  const [alertId, setAlertId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const u = getUser();
    if (u) setUsername(u.username);
  }, []);

  const shown = tickets.filter((t) => filter === "ALL" || t.status === filter);
  const count = (s: TicketStatus) => tickets.filter((t) => t.status === s).length;

  // Sửa 1 ticket theo id
  function update(id: string, changes: Partial<Ticket>) {
    setTickets((list) => list.map((t) => (t.id === id ? { ...t, ...changes } : t)));
  }

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      setError("Vui lòng nhập tiêu đề ticket");
      return;
    }
    const server = mockServers.find((s) => s.id === serverId)!;
    const next = tickets.length + 1;
    const newTicket: Ticket = {
      id: `TK-${String(next).padStart(3, "0")}`,
      title: title.trim(),
      description: description.trim(),
      serverId: server.id,
      serverName: server.name,
      priority,
      status: "OPEN",
      assignee: null,
      alertId: alertId.trim() || null,
      createdBy: username || "operator",
      createdAt: now(),
      note: null,
    };
    setTickets((list) => [newTicket, ...list]);
    setTitle("");
    setDescription("");
    setAlertId("");
    setPriority("MEDIUM");
    setError("");
    setShowForm(false);
  }

  // Gán technician: ticket chuyển sang "Đang xử lý".
  // (Sau này technician sẽ xác nhận trên app mobile, lúc đó sửa lại chỗ này)
  function handleAssign(id: string, tech: string) {
    if (!tech) return;
    update(id, { assignee: tech, status: "IN_PROGRESS" });
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quản lý Ticket bảo trì</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded bg-blue-600 px-4 py-2 text-white"
        >
          {showForm ? "Đóng form" : "+ Tạo ticket"}
        </button>
      </div>

      {/* Thống kê theo trạng thái */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {STATUSES.map((s) => (
          <div key={s} className="rounded-lg border border-gray-500/30 p-4">
            <p className="text-sm opacity-70">{STATUS_LABEL[s]}</p>
            <p className="mt-1 text-3xl font-bold">{count(s)}</p>
          </div>
        ))}
      </div>

      {/* Form tạo ticket */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="space-y-3 rounded-lg border border-gray-500/30 p-4"
        >
          <h2 className="font-bold">Tạo ticket mới</h2>
          <input
            className="w-full rounded border border-gray-500/30 bg-transparent p-2"
            placeholder="Tiêu đề (ví dụ: CPU srv-db-01 quá cao)"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <textarea
            className="w-full rounded border border-gray-500/30 bg-transparent p-2"
            rows={3}
            placeholder="Mô tả sự cố"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
          <div className="grid gap-3 md:grid-cols-3">
            <select
              className="rounded border border-gray-500/30 bg-transparent p-2"
              value={serverId}
              onChange={(e) => setServerId(e.target.value)}
            >
              {mockServers.map((s) => (
                <option key={s.id} value={s.id} className="text-gray-900">
                  {s.name} ({s.location})
                </option>
              ))}
            </select>
            <select
              className="rounded border border-gray-500/30 bg-transparent p-2"
              value={priority}
              onChange={(e) => setPriority(e.target.value as TicketPriority)}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p} className="text-gray-900">
                  Ưu tiên: {p}
                </option>
              ))}
            </select>
            <input
              className="rounded border border-gray-500/30 bg-transparent p-2"
              placeholder="Mã cảnh báo gốc (nếu có)"
              value={alertId}
              onChange={(e) => setAlertId(e.target.value)}
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button className="rounded bg-blue-600 px-4 py-2 text-white">
            Lưu ticket
          </button>
        </form>
      )}

      {/* Bộ lọc trạng thái */}
      <div className="flex flex-wrap gap-2">
        {(["ALL", ...STATUSES] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded px-3 py-1 text-sm ${
              filter === s ? "bg-blue-600 text-white" : "border border-gray-500/30"
            }`}
          >
            {s === "ALL" ? "Tất cả" : STATUS_LABEL[s]}
          </button>
        ))}
      </div>

      {/* Bảng ticket */}
      <div className="overflow-x-auto rounded-lg border border-gray-500/30">
        <table className="w-full text-left">
          <thead className="bg-gray-500/10">
            <tr>
              <th className="p-3">Mã</th>
              <th className="p-3">Tiêu đề</th>
              <th className="p-3">Máy chủ</th>
              <th className="p-3">Ưu tiên</th>
              <th className="p-3">Trạng thái</th>
              <th className="p-3">Người xử lý</th>
              <th className="p-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {shown.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center opacity-70">
                  Không có ticket nào
                </td>
              </tr>
            )}
            {shown.map((t) => (
              <Fragment key={t.id}>
                <tr className="border-t border-gray-500/30">
                  <td className="p-3 font-medium">{t.id}</td>
                  <td className="p-3">
                    <button
                      onClick={() => setOpenId(openId === t.id ? null : t.id)}
                      className="text-left underline"
                    >
                      {t.title}
                    </button>
                  </td>
                  <td className="p-3">{t.serverName}</td>
                  <td className="p-3">
                    <span className={`rounded px-2 py-1 text-sm ${PRIORITY_STYLE[t.priority]}`}>
                      {t.priority}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`rounded px-2 py-1 text-sm ${STATUS_STYLE[t.status]}`}>
                      {STATUS_LABEL[t.status]}
                    </span>
                  </td>
                  <td className="p-3">{t.assignee ?? "—"}</td>
                  <td className="p-3">
                    {t.status === "OPEN" && (
                      <select
                        className="rounded border border-gray-500/30 bg-transparent p-1 text-sm"
                        value=""
                        onChange={(e) => handleAssign(t.id, e.target.value)}
                      >
                        <option value="" className="text-gray-900">
                          Gán cho...
                        </option>
                        {mockTechnicians.map((name) => (
                          <option key={name} value={name} className="text-gray-900">
                            {name}
                          </option>
                        ))}
                      </select>
                    )}
                    {t.status === "RESOLVED" && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => update(t.id, { status: "CLOSED" })}
                          className="rounded bg-green-600 px-2 py-1 text-sm text-white"
                        >
                          Duyệt đóng
                        </button>
                        <button
                          onClick={() => update(t.id, { status: "IN_PROGRESS" })}
                          className="rounded bg-red-600 px-2 py-1 text-sm text-white"
                        >
                          Từ chối
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
                {openId === t.id && (
                  <tr className="bg-gray-500/10">
                    <td colSpan={7} className="space-y-1 p-4 text-sm">
                      <p><b>Mô tả:</b> {t.description || "—"}</p>
                      <p><b>Cảnh báo gốc:</b> {t.alertId ?? "Không có"}</p>
                      <p><b>Người tạo:</b> {t.createdBy} — {t.createdAt}</p>
                      <p><b>Ghi chú xử lý:</b> {t.note ?? "Chưa có"}</p>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
