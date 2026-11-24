---
name: ar-imms-auth-and-roles
description: Xác thực JWT, API key cho Agent và phân quyền ADMIN/OPERATOR/TECHNICIAN trong backend AR-IMMS. Dùng khi thêm API cần đăng nhập hoặc giới hạn theo vai trò.
---

# Xác thực và phân quyền

Có **hai cách xác thực khác nhau**:

1. **Người dùng (web)**: `POST /auth/login` trả `access_token`; gửi `Authorization: Bearer <token>`. Bảo vệ bằng `@UseGuards(JwtAuthGuard)`. Payload JWT: `sub`, `email`, `role`.
2. **Collector Agent**: header `x-api-key` so với `API_KEY` trong `.env`, chỉ dùng cho `POST /metrics` qua `ApiKeyGuard` (so sánh bằng `timingSafeEqual`).

Đăng nhập kiểm tra email/mật khẩu (`bcrypt.compare`) và `isActive`; thất bại hay thành công đều ghi audit (`LOGIN_FAILED`, `LOGIN`).

## Phân quyền theo vai trò

Vai trò: `ADMIN`, `OPERATOR`, `TECHNICIAN` (`src/common/role.enum.ts`).
Dùng `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(Role.ADMIN, ...)`. Không có `@Roles` nghĩa là mọi user đã đăng nhập đều vào được. `JwtAuthGuard` phải đứng **trước** `RolesGuard` vì `RolesGuard` đọc `req.user`.

## Quyền hiện tại

- `users/*`, `audit-logs`: chỉ ADMIN
- `servers`: xem - mọi user đăng nhập; tạo/sửa/xóa/đổi ngưỡng - ADMIN; đổi trạng thái - ADMIN, OPERATOR
- `alerts`: xem - mọi user đăng nhập; acknowledge/resolve - ADMIN, OPERATOR
- `metrics`: `POST` dùng API key; `GET` dùng JWT
