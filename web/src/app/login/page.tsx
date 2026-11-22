"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { apiLogin, fakeLogin, saveSession } from "@/lib/auth";
import { clearToken } from "@/lib/api";
import { User } from "@/types";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      let user: User;
      if (username.includes("@")) {
        // Có dấu @ nghĩa là email: đăng nhập thật qua Backend
        user = await apiLogin(username, password);
      } else {
        // Không có @: dùng tài khoản giả để thử khi chưa có Backend
        user = fakeLogin(username, password);
        clearToken();
      }
      saveSession(user);
      router.push("/dashboard");
    } catch (err) {
      setError((err as Error).message);
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="w-80 space-y-4 rounded-lg bg-white p-6 shadow"
      >
        <h1 className="text-xl font-bold text-gray-900">Đăng nhập hệ thống</h1>
        <input
          className="w-full rounded border p-2 text-gray-900"
          placeholder="Email hoặc tên đăng nhập"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <input
          className="w-full rounded border p-2 text-gray-900"
          type="password"
          placeholder="Mật khẩu"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <p className="text-xs text-gray-500">
          Nhập email để đăng nhập bằng Backend, hoặc tên đăng nhập để dùng chế độ thử.
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          disabled={loading}
          className="w-full rounded bg-blue-600 p-2 text-white disabled:opacity-60"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>
      </form>
    </div>
  );
}