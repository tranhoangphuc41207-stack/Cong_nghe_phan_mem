"use client";
import { useEffect, useState } from "react";
import { getUser } from "@/lib/auth";
import { defaultSettings } from "@/lib/settings-mock";
import { SystemSettings } from "@/types";

export default function SettingsPage() {
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [settings, setSettings] = useState<SystemSettings>(defaultSettings);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Chỉ ADMIN được vào trang này
  useEffect(() => {
    setIsAdmin(getUser()?.role === "ADMIN");
    setReady(true);
  }, []);

  function change<K extends keyof SystemSettings>(
    key: K,
    value: SystemSettings[K]
  ) {
    setMessage("");
    setError("");
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!settings.systemName.trim()) {
      setError("Tên hệ thống không được để trống");
      return;
    }
    if (settings.refreshSeconds < 1 || settings.refreshSeconds > 3600) {
      setError("Chu kỳ làm mới phải từ 1 đến 3600 giây");
      return;
    }
    if (settings.retentionDays < 1 || settings.retentionDays > 365) {
      setError("Thời gian lưu dữ liệu phải từ 1 đến 365 ngày");
      return;
    }
    setError("");
    setMessage("Đã lưu cấu hình (dữ liệu giả, chưa gửi lên máy chủ)");
  }

  function reset() {
    setSettings(defaultSettings);
    setError("");
    setMessage("Đã khôi phục giá trị mặc định");
  }

  if (!ready) return null;
  if (!isAdmin) {
    return (
      <div className="p-6">Bạn không có quyền xem trang này (chỉ ADMIN).</div>
    );
  }

  return (
    <div className="max-w-2xl space-y-6 p-6">
      <h1 className="text-2xl font-bold">Cấu hình hệ thống</h1>

      <form onSubmit={save} className="space-y-5">
        <div className="space-y-4 rounded-lg border border-gray-500/30 p-4">
          <h2 className="font-bold">Chung</h2>
          <label className="block text-sm">
            Tên hệ thống
            <input
              className="mt-1 w-full rounded border border-gray-500/50 bg-transparent p-2"
              value={settings.systemName}
              onChange={(e) => change("systemName", e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Chu kỳ làm mới dữ liệu (giây)
            <input
              type="number"
              className="mt-1 w-full rounded border border-gray-500/50 bg-transparent p-2"
              value={settings.refreshSeconds}
              onChange={(e) => change("refreshSeconds", Number(e.target.value))}
            />
          </label>
          <label className="block text-sm">
            Thời gian lưu dữ liệu giám sát (ngày)
            <input
              type="number"
              className="mt-1 w-full rounded border border-gray-500/50 bg-transparent p-2"
              value={settings.retentionDays}
              onChange={(e) => change("retentionDays", Number(e.target.value))}
            />
          </label>
        </div>

        <div className="space-y-3 rounded-lg border border-gray-500/30 p-4">
          <h2 className="font-bold">Thông báo</h2>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={settings.emailAlerts}
              onChange={(e) => change("emailAlerts", e.target.checked)}
            />
            Gửi email khi có cảnh báo nghiêm trọng
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={settings.soundAlerts}
              onChange={(e) => change("soundAlerts", e.target.checked)}
            />
            Phát âm thanh khi có cảnh báo mới
          </label>
        </div>

        <div className="flex items-center gap-3">
          <button className="rounded bg-blue-600 px-4 py-2 text-white">
            Lưu cấu hình
          </button>
          <button
            type="button"
            onClick={reset}
            className="rounded border border-gray-500/50 px-4 py-2"
          >
            Khôi phục mặc định
          </button>
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}
        {message && <p className="text-sm text-green-500">{message}</p>}
      </form>
    </div>
  );
}