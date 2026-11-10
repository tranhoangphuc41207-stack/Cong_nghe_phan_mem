import { User } from "@/types";

// Tài khoản giả để thử. Khi Bảo có API đăng nhập thật thì thay phần này.
const FAKE_USERS = [
  { username: "admin", password: "123456", role: "ADMIN" as const },
  { username: "operator", password: "123456", role: "OPERATOR" as const },
];

export function fakeLogin(username: string, password: string): User {
  const found = FAKE_USERS.find(
    (u) => u.username === username && u.password === password
  );
  if (!found) throw new Error("Sai tên đăng nhập hoặc mật khẩu");
  return { id: "1", username: found.username, role: found.role };
}

export function saveSession(user: User) {
  localStorage.setItem("user", JSON.stringify(user));
}

export function getUser(): User | null {
  const raw = localStorage.getItem("user");
  return raw ? JSON.parse(raw) : null;
}

export function logout() {
  localStorage.removeItem("user");
}