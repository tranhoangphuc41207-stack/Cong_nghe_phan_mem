"use client";
import { useEffect, useState } from "react";
import { getUser } from "@/lib/auth";
import { mockUsers } from "@/lib/users-mock";
import { AppUser, Role } from "@/types";

const ROLES: Role[] = ["ADMIN", "OPERATOR", "TECHNICIAN"];

export default function UsersPage() {
  const [ready, setReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [me, setMe] = useState("");
  const [users, setUsers] = useState<AppUser[]>(mockUsers);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState<Role>("OPERATOR");
  const [error, setError] = useState("");

  // Chỉ ADMIN được vào trang này
  useEffect(() => {
    const u = getUser();
    setIsAdmin(u?.role === "ADMIN");
    setMe(u?.username ?? "");
    setReady(true);
  }, []);

  function addUser(e: React.FormEvent) {
    e.preventDefault();
    const name = username.trim();
    if (!name || !fullName.trim()) {
      setError("Vui lòng nhập đủ tên đăng nhập và họ tên");
      return;
    }
    if (users.some((u) => u.username === name)) {
      setError("Tên đăng nhập đã tồn tại");
      return;
    }
    setUsers((prev) => [
      ...prev,
      {
        id: String(Date.now()),
        username: name,
        fullName: fullName.trim(),
        role,
        active: true,
      },
    ]);
    setUsername("");
    setFullName("");
    setRole("OPERATOR");
    setError("");
  }

  function changeRole(id: string, newRole: Role) {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role: newRole } : u))
    );
  }

  function toggleActive(id: string) {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, active: !u.active } : u))
    );
  }

  if (!ready) return null;
  if (!isAdmin) {
    return (
      <div className="p-6">Bạn không có quyền xem trang này (chỉ ADMIN).</div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Quản lý tài khoản</h1>

      <form
        onSubmit={addUser}
        className="space-y-3 rounded-lg border border-gray-500/30 p-4"
      >
        <h2 className="font-bold">Thêm tài khoản</h2>
        <div className="grid gap-3 md:grid-cols-4">
          <input
            className="rounded border border-gray-500/50 bg-transparent p-2"
            placeholder="Tên đăng nhập"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            className="rounded border border-gray-500/50 bg-transparent p-2"
            placeholder="Họ tên"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
          <select
            className="rounded border border-gray-500/50 bg-transparent p-2"
            value={role}
            onChange={(e) => setRole(e.target.value as Role)}
          >
            {ROLES.map((r) => (
              <option key={r} value={r} className="text-black">
                {r}
              </option>
            ))}
          </select>
          <button className="rounded bg-blue-600 p-2 text-white">Thêm</button>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </form>

      <div className="overflow-x-auto rounded-lg border border-gray-500/30">
        <table className="w-full text-left">
          <thead className="bg-gray-500/10">
            <tr>
              <th className="p-3">Tên đăng nhập</th>
              <th className="p-3">Họ tên</th>
              <th className="p-3">Vai trò</th>
              <th className="p-3">Trạng thái</th>
              <th className="p-3">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => {
              const isMe = u.username === me;
              return (
                <tr key={u.id} className="border-t border-gray-500/30">
                  <td className="p-3 font-medium">
                    {u.username}
                    {isMe && <span className="ml-2 text-xs opacity-70">(bạn)</span>}
                  </td>
                  <td className="p-3">{u.fullName}</td>
                  <td className="p-3">
                    <select
                      disabled={isMe}
                      value={u.role}
                      onChange={(e) => changeRole(u.id, e.target.value as Role)}
                      className="rounded border border-gray-500/50 bg-transparent p-1 disabled:opacity-50"
                    >
                      {ROLES.map((r) => (
                        <option key={r} value={r} className="text-black">
                          {r}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="p-3">
                    <span
                      className={`rounded px-2 py-1 text-sm ${
                        u.active
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {u.active ? "Hoạt động" : "Đã khóa"}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      disabled={isMe}
                      onClick={() => toggleActive(u.id)}
                      className="rounded border border-gray-500/50 px-2 py-1 text-sm hover:bg-gray-500/20 disabled:opacity-50"
                    >
                      {u.active ? "Khóa" : "Mở khóa"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}