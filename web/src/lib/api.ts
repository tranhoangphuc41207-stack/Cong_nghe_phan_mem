// Lớp gọi API chung tới Backend NestJS (KAN-64).
// Địa chỉ Backend lấy từ file .env.local (biến NEXT_PUBLIC_API_URL).

export const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";
const TOKEN_KEY = "token";

export class ApiError extends Error {
  status: number; // 0 nghĩa là không kết nối được hoặc chưa đăng nhập
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// Backend trả message là chuỗi hoặc mảng chuỗi (lỗi kiểm tra dữ liệu)
function readMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object" && "message" in data) {
    const m = (data as { message: unknown }).message;
    if (Array.isArray(m)) return m.join(", ");
    if (typeof m === "string") return m;
  }
  return fallback;
}

// Gọi API. auth = true thì tự gắn token đăng nhập vào header.
export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  auth = true
): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set("Content-Type", "application/json");

  const token = getToken();
  if (auth) {
    if (!token) throw new ApiError(0, "Chưa đăng nhập bằng tài khoản Backend");
    headers.set("Authorization", `Bearer ${token}`);
  }

  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { ...options, headers });
  } catch {
    throw new ApiError(0, "Không kết nối được Backend");
  }

  let data: unknown = null;
  try {
    data = await res.json();
  } catch {
    data = null;
  }

  if (!res.ok) {
    // Token sai hoặc hết hạn (1 ngày): xóa phiên và đưa về trang đăng nhập
    if (res.status === 401 && auth && token) {
      clearToken();
      localStorage.removeItem("user");
      window.location.href = "/login";
    }
    throw new ApiError(res.status, readMessage(data, `Lỗi ${res.status}`));
  }
  return data as T;
}

// ----- Đăng nhập -----
export interface ApiUser {
  id: number;
  fullName: string;
  email: string;
  role: "ADMIN" | "OPERATOR" | "TECHNICIAN";
}

export interface LoginResult {
  access_token: string;
  user: ApiUser;
}

export function apiLoginRequest(email: string, password: string) {
  return apiFetch<LoginResult>(
    "/auth/login",
    { method: "POST", body: JSON.stringify({ email, password }) },
    false
  );
}