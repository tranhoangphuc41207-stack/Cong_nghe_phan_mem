"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getUser, logout } from "@/lib/auth";
import { Role, User } from "@/types";

// Danh sách menu. Mỗi mục có danh sách vai trò được thấy.
const MENU: { label: string; href: string; roles: Role[] }[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    roles: ["ADMIN", "OPERATOR", "TECHNICIAN"],
  },
    {
    label: "Cấu hình",
    href: "/settings",
    roles: ["ADMIN"],
  },
  {
    label: "Máy chủ",
    href: "/servers",
    roles: ["ADMIN", "OPERATOR", "TECHNICIAN"],
  },
    {
    label: "Cảnh báo",
    href: "/alerts",
    roles: ["ADMIN", "OPERATOR", "TECHNICIAN"],
  },
    {
    label: "Hạ tầng",
    href: "/infrastructure",
    roles: ["ADMIN", "OPERATOR"],
  },
    {
    label: "Người dùng",
    href: "/users",
    roles: ["ADMIN"],
  },
  {
    label: "Ticket bảo trì",
    href: "/tickets",
    roles: ["ADMIN", "OPERATOR"],
  },
  {
    label: "Phần cứng",
    href: "/hardware",
    roles: ["ADMIN", "OPERATOR"],
  },
  // Khi làm xong trang nào thì thêm dòng vào đây, ví dụ:
  // { label: "Người dùng", href: "/users", roles: ["ADMIN"] },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<User | null>(null);

  // Chưa đăng nhập thì đưa về trang login
  useEffect(() => {
    const u = getUser();
    if (!u) {
      router.replace("/login");
    } else {
      setUser(u);
    }
  }, [router]);

  function handleLogout() {
    logout();
    router.replace("/login");
  }

  if (!user) return null;

  return (
    <div className="flex min-h-screen">
      <aside className="w-56 bg-gray-900 p-4 text-white">
        <h2 className="mb-6 text-lg font-bold">Data Center</h2>
        <nav className="space-y-1">
          {MENU.filter((m) => m.roles.includes(user.role)).map((m) => (
            <Link
              key={m.href}
              href={m.href}
              className={`block rounded px-3 py-2 ${
                pathname === m.href ? "bg-blue-600" : "hover:bg-gray-700"
              }`}
            >
              {m.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-between border-b px-6 py-3">
          <span>
            Xin chào, <b>{user.username}</b> ({user.role})
          </span>
          <button
            onClick={handleLogout}
            className="rounded bg-red-600 px-3 py-1 text-white"
          >
            Đăng xuất
          </button>
        </header>
        <main>{children}</main>
      </div>
    </div>
  );
}