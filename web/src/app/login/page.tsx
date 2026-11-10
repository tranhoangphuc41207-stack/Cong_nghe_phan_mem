"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { fakeLogin, saveSession } from "@/lib/auth";

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const user = fakeLogin(username, password);
      saveSession(user);
      router.push("/dashboard");
    } catch (err) {
      setError((err as Error).message);
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
          placeholder="Tên đăng nhập"
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
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button className="w-full rounded bg-blue-600 p-2 text-white">
          Đăng nhập
        </button>
      </form>
    </div>
  );
}