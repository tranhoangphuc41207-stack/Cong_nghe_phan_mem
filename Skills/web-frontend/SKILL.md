---
name: ar-imms-web-frontend
description: Hướng dẫn làm việc với web AR-IMMS (Next.js + React + Tailwind) - cách gọi API Backend, đăng nhập, menu theo vai trò, cảnh báo realtime Socket.IO và các trang còn dùng dữ liệu mock. Dùng khi sửa hoặc thêm trang trong `web/`.
---

# AR-IMMS Web (thư mục `web/`)

Next.js 16 (App Router), React 19, Tailwind 4, TypeScript, `socket.io-client`.
Chạy: `cd web && npm install && npm run dev`. Backend mặc định `http://localhost:3000`, đổi bằng `NEXT_PUBLIC_API_URL` trong `.env.local`.

Lưu ý: `web/AGENTS.md` cảnh báo Next.js bản này có thay đổi so với phiên bản cũ; đọc tài liệu trong `node_modules/next/dist/docs/` trước khi dùng API Next.js mà không chắc.

## Cấu trúc

- `src/app/login/page.tsx` - đăng nhập
- `src/app/(dashboard)/` - các trang sau đăng nhập (`dashboard`, `servers`, `servers/[id]`, `alerts`, `hardware`, `infrastructure`, `reports`, `tickets`, `users`, `settings`) và `layout.tsx` chứa menu
- `src/lib/api.ts` - hàm gọi API chung (`apiFetch`), lưu token
- `src/lib/auth.ts` - đăng nhập, lưu phiên người dùng
- `src/lib/server-api.ts` - kiểu dữ liệu và hàm gọi API máy chủ/metrics
- `src/lib/*-mock.ts` - dữ liệu mẫu
- `src/types/` - kiểu dữ liệu dùng chung

## Gọi API Backend

Luôn dùng `apiFetch<T>(path, options, auth = true)` trong `src/lib/api.ts`, đừng gọi `fetch` trực tiếp:

- Tự gắn `Authorization: Bearer <token>` (token lấy từ `localStorage`, khóa `token`).
- Chưa có token -> ném `ApiError(0, ...)`; không kết nối được Backend -> `ApiError(0, ...)`.
- Gặp 401 khi đã có token (hết hạn) -> xóa phiên và chuyển về `/login`.
- Lỗi validate của Backend (mảng chuỗi) được nối thành một thông báo.

Thêm API mới: viết kiểu dữ liệu + hàm bọc `apiFetch` trong `server-api.ts` (hoặc file tương tự), rồi gọi từ trang.

## Đăng nhập và vai trò

- `apiLogin(email, password)` gọi `POST /auth/login`, lưu `access_token` và thông tin user (`localStorage` khóa `user`).
- `layout.tsx` của `(dashboard)` đọc `getUser()`; chưa đăng nhập thì `router.replace("/login")`.
- Menu có mảng `roles` cho từng mục; chỉ hiện mục phù hợp vai trò (ADMIN, OPERATOR, TECHNICIAN).
- Ẩn menu **không** thay thế phân quyền thật: quyền kiểm tra ở Backend (`RolesGuard`).
- `fakeLogin` (admin/operator, mật khẩu 123456) chỉ để thử khi chưa có Backend, không dùng cho bản nộp.

## Cảnh báo realtime

Trang `alerts/page.tsx`:

1. Tải danh sách ban đầu qua API.
2. Kết nối `io(API_URL, { auth: { token } })`; Backend `AlertsGateway` kiểm tra JWT ở bước handshake, sai token -> `Unauthorized`.
3. Lắng nghe `alert:new`, `alert:updated`, `alert:resolved` để cập nhật danh sách.
4. Ngắt kết nối khi rời trang (`socket.disconnect()`).

## Trang nào đã nối API, trang nào còn mock

- Đã nối Backend: `servers` (danh sách), `alerts` (API + Socket.IO), `reports/live-metrics.tsx` (`GET /metrics/latest`, tự làm mới theo chu kỳ), `hardware` (một phần, chuyển `ApiServer` -> `Hardware` bằng `serverToHardware`).
- Còn dùng dữ liệu mock: `dashboard`, `infrastructure`, `users`, `settings`, `tickets`, `servers/[id]`, `reports/page.tsx`.
- Backend chưa có API cho `tickets`, nên trang này chưa nối được.

## Quy ước

- Thông báo hiển thị cho người dùng bằng tiếng Việt.
- Dữ liệu số từ Backend có thể là `null` (máy chủ chưa gửi số liệu); luôn xử lý trường hợp này.
- Ngày từ Backend có thể kèm giờ; cắt `slice(0, 10)` khi chỉ cần `YYYY-MM-DD`.
