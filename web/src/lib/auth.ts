import { User } from "@/types";
import { apiLoginRequest, clearToken, saveToken } from "@/lib/api";

// Tài khoản giả để thử khi chưa kết nối được Backend.
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

// Đăng nhập thật bằng email và mật khẩu qua Backend (POST /auth/login).
// Lưu token để các trang gọi API, trả về User cho phần giao diện.
export async function apiLogin(email: string, password: string): Promise<User> {
  const result = await apiLoginRequest(email.trim(), password);
  saveToken(result.access_token);
  return {
    id: String(result.user.id),
    username: result.user.fullName || result.user.email,
    role: result.user.role,
  };
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
  clearToken();
}