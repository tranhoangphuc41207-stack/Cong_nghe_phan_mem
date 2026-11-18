"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { mockServers } from "@/lib/dashboard-mock";
import {
  ApiLatestMetric,
  ApiServer,
  createServer,
  fetchLatestMetrics,
  fetchServers,
  nextServerDefaults,
} from "@/lib/server-api";
import { getUser } from "@/lib/auth";
import { ServerStatus } from "@/types";

// Máy chủ mới thêm chưa có số liệu nên có trạng thái UNKNOWN
type RowStatus = ServerStatus | "UNKNOWN";

interface Row {
  id: string;
  name: string;
  ip: string;
  location: string;
  status: RowStatus;
  cpu: number | null;
  ram: number | null;
  network: string;
}

const STATUS_STYLE: Record<RowStatus, string> = {
  ONLINE: "bg-green-100 text-green-700",
  WARNING: "bg-yellow-100 text-yellow-700",
  OFFLINE: "bg-red-100 text-red-700",
  UNKNOWN: "bg-gray-200 text-gray-700",
};

type Filter = "ALL" | ServerStatus;

const FILTERS: { value: Filter; label: string }[] = [
  { value: "ALL", label: "Tất cả" },
  { value: "ONLINE", label: "Hoạt động" },
  { value: "WARNING", label: "Cảnh báo" },
  { value: "OFFLINE", label: "Mất kết nối" },
];

type Source = "loading" | "api" | "mock";

// Dữ liệu form nhập tay
const EMPTY_FORM = {
  serverCode: "",
  name: "",
  description: "",
  location: "",
  manufacturer: "",
  model: "",
  serialNumber: "",
  cpuModel: "",
  ramGb: "",
  storageGb: "",
  purchaseDate: "",
  warrantyExpiry: "",
};
type FormState = typeof EMPTY_FORM;

// Danh sách các ô nhập trong form (mỗi phần tử là một ô)
const FIELDS: {
  key: keyof FormState;
  label: string;
  placeholder?: string;
  type?: string;
  maxLength?: number;
}[] = [
  { key: "serverCode", label: "Mã máy chủ * (duy nhất, tối đa 50 ký tự)", placeholder: "VD: SRV-010", maxLength: 50 },
  { key: "name", label: "Tên máy chủ * (tối đa 100 ký tự)", placeholder: "VD: web-server-01", maxLength: 100 },
  { key: "location", label: "Vị trí", placeholder: "VD: Phòng server tầng 2" },
  { key: "description", label: "Mô tả", placeholder: "VD: Máy chủ web chính" },
  { key: "manufacturer", label: "Hãng sản xuất", placeholder: "VD: Dell" },
  { key: "model", label: "Model", placeholder: "VD: PowerEdge R740" },
  { key: "serialNumber", label: "Số serial" },
  { key: "cpuModel", label: "CPU", placeholder: "VD: Intel Xeon Silver 4210" },
  { key: "ramGb", label: "RAM (GB)", placeholder: "VD: 64", type: "number" },
  { key: "storageGb", label: "Lưu trữ (GB)", placeholder: "VD: 2000", type: "number" },
  { key: "purchaseDate", label: "Ngày mua", type: "date" },
  { key: "warrantyExpiry", label: "Hết hạn bảo hành", type: "date" },
];

export default function ServersPage() {
  const [keyword, setKeyword] = useState("");
  const [filter, setFilter] = useState<Filter>("ALL");

  const [rows, setRows] = useState<Row[]>([]);
  const [apiList, setApiList] = useState<ApiServer[]>([]);
  const [source, setSource] = useState<Source>("loading");
  const [notice, setNotice] = useState("");

  const [isAdmin, setIsAdmin] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addMessage, setAddMessage] = useState("");
  const [addError, setAddError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);

  const load = useCallback(async () => {
    try {
      const [list, latest] = await Promise.all([
        fetchServers(),
        fetchLatestMetrics().catch(() => [] as ApiLatestMetric[]),
      ]);
      const latestById = new Map(latest.map((m) => [m.serverId, m.latest]));
      setApiList(list);
      setRows(
        list.map((s) => {
          const m = latestById.get(s.id) ?? null;
          const hasNet = m && (m.networkIn !== null || m.networkOut !== null);
          return {
            id: String(s.id),
            name: s.name,
            ip: "—",
            location: s.location ?? "—",
            status: s.status,
            cpu: m ? m.cpuUsage : null,
            ram: m ? m.ramUsage : null,
            network: hasNet ? `${m.networkIn ?? 0} / ${m.networkOut ?? 0}` : "—",
          };
        })
      );
      setNotice("");
      setSource("api");
    } catch (err) {
      setApiList([]);
      setRows(
        mockServers.map((s) => ({
          id: s.id,
          name: s.name,
          ip: s.ip,
          location: s.location,
          status: s.status,
          cpu: s.cpu,
          ram: s.ram,
          network: String(s.network),
        }))
      );
      setNotice((err as Error).message);
      setSource("mock");
    }
  }, []);

  useEffect(() => {
    setIsAdmin(getUser()?.role === "ADMIN");
    void load();
  }, [load]);

  // Bấm "+ Thêm máy chủ": mở form, điền sẵn mã gợi ý (sửa được)
  function openForm() {
    const { serverCode, name } = nextServerDefaults(apiList);
    setForm({ ...EMPTY_FORM, serverCode, name });
    setAddMessage("");
    setAddError("");
    setShowForm(true);
  }

  // Bấm "Lưu": kiểm tra dữ liệu rồi gọi POST /servers
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAddMessage("");
    setAddError("");

    const serverCode = form.serverCode.trim();
    const name = form.name.trim();
    if (!serverCode || !name) {
      setAddError("Mã máy chủ và tên máy chủ không được để trống");
      return;
    }

    const ram = form.ramGb.trim() ? Number(form.ramGb) : undefined;
    const storage = form.storageGb.trim() ? Number(form.storageGb) : undefined;
    const bad = (n: number | undefined) => n !== undefined && (isNaN(n) || n < 0);
    if (bad(ram) || bad(storage)) {
      setAddError("RAM và dung lượng lưu trữ phải là số không âm");
      return;
    }

    setAdding(true);
    try {
      const created = await createServer({
        serverCode,
        name,
        description: form.description.trim() || undefined,
        location: form.location.trim() || undefined,
        manufacturer: form.manufacturer.trim() || undefined,
        model: form.model.trim() || undefined,
        serialNumber: form.serialNumber.trim() || undefined,
        cpuModel: form.cpuModel.trim() || undefined,
        ramGb: ram,
        storageGb: storage,
        purchaseDate: form.purchaseDate || undefined,
        warrantyExpiry: form.warrantyExpiry || undefined,
      });
      await load();
      setAddMessage(`Đã thêm máy chủ ${created.name} (${created.serverCode})`);
      setShowForm(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      setAddError((err as Error).message);
    } finally {
      setAdding(false);
    }
  }

  const kw = keyword.trim().toLowerCase();
  const list = rows.filter((s) => {
    const okStatus = filter === "ALL" || s.status === filter;
    const okKeyword =
      !kw ||
      s.name.toLowerCase().includes(kw) ||
      s.ip.includes(kw) ||
      s.location.toLowerCase().includes(kw);
    return okStatus && okKeyword;
  });

  const inputCls = "w-full rounded border border-gray-500/50 bg-transparent p-2";

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Danh sách máy chủ</h1>
        {isAdmin && (
          <button
            onClick={openForm}
            disabled={source !== "api"}
            title={source !== "api" ? "Cần kết nối Backend bằng tài khoản ADMIN" : undefined}
            className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
          >
            + Thêm máy chủ
          </button>
        )}
      </div>

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="space-y-3 rounded-lg border border-gray-500/30 p-4"
        >
          <h2 className="text-lg font-semibold">Thêm máy chủ mới</h2>
          <div className="grid gap-3 md:grid-cols-2">
            {FIELDS.map((f) => (
              <div key={f.key}>
                <label className="mb-1 block text-sm">{f.label}</label>
                <input
                  type={f.type ?? "text"}
                  min={f.type === "number" ? 0 : undefined}
                  maxLength={f.maxLength}
                  className={inputCls}
                  placeholder={f.placeholder}
                  value={form[f.key]}
                  onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={adding}
              className="rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
            >
              {adding ? "Đang lưu..." : "Lưu"}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="rounded border border-gray-500/50 px-4 py-2"
            >
              Hủy
            </button>
          </div>
        </form>
      )}

      {source === "loading" && <p className="text-sm opacity-70">Đang tải dữ liệu từ Backend...</p>}
      {source === "mock" && (
        <p className="rounded bg-orange-100 p-3 text-sm text-orange-800">
          Chưa lấy được dữ liệu thật: {notice}. Đang hiển thị dữ liệu giả. Để xem dữ liệu thật và thêm máy chủ,
          hãy đăng nhập bằng email ADMIN của Backend.
        </p>
      )}
      {addMessage && <p className="rounded bg-green-100 p-3 text-sm text-green-800">{addMessage}</p>}
      {addError && <p className="rounded bg-red-100 p-3 text-sm text-red-700">{addError}</p>}

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
                filter === f.value ? "bg-blue-600 text-white" : "border border-gray-500/50"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className="text-sm opacity-70">
        Hiển thị {list.length} / {rows.length} máy chủ
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
              <th className="p-3">Mạng (vào / ra)</th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.id} className="border-t border-gray-500/30">
                <td className="p-3">
                  <Link href={`/servers/${s.id}`} className="font-medium text-blue-500 hover:underline">
                    {s.name}
                  </Link>
                </td>
                <td className="p-3">{s.ip}</td>
                <td className="p-3">{s.location}</td>
                <td className="p-3">
                  <span className={`rounded px-2 py-1 text-sm ${STATUS_STYLE[s.status]}`}>
                    {s.status}
                  </span>
                </td>
                <td className="p-3">{s.cpu === null ? "—" : `${s.cpu}%`}</td>
                <td className="p-3">{s.ram === null ? "—" : `${s.ram}%`}</td>
                <td className="p-3">{s.network}</td>
              </tr>
            ))}
            {list.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center opacity-70">
                  {source === "loading" ? "Đang tải..." : "Không tìm thấy máy chủ phù hợp"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
