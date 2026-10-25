# 9. Web Admin (Frontend)

## 9.1. Mục đích
Web Admin là giao diện quản trị của AR-IMMS dành cho Administrator và Operator: giám sát máy chủ, cảnh báo, hạ tầng, tài khoản và cấu hình. Nội dung này được ghi theo mã nguồn Frontend hiện có (thư mục `web/`).

## 9.2. Phạm vi đã làm trong mã nguồn
- Đăng nhập (tài khoản giả) và phân quyền giao diện theo vai trò `ADMIN`, `OPERATOR`, `TECHNICIAN`.
- Dashboard: số máy chủ theo trạng thái, CPU, RAM, mạng, Docker; tự làm mới (mô phỏng).
- Danh sách máy chủ (tìm kiếm, lọc trạng thái) và trang chi tiết từng máy.
- Cảnh báo: xem, đánh dấu đã xử lý, chỉnh ngưỡng (chỉ `ADMIN`).
- Hạ tầng: sơ đồ phòng và rack theo trạng thái máy.
- Quản lý tài khoản và cấu hình hệ thống (chỉ `ADMIN`).

## 9.3. Các trang

| Trang | Đường dẫn | Vai trò | Jira |
|---|---|---|---|
| Đăng nhập | `/login` | Tất cả | KAN-58 |
| Dashboard | `/dashboard` | Tất cả | KAN-60, 72 |
| Máy chủ | `/servers`, `/servers/[id]` | Tất cả | KAN-65, 66 |
| Cảnh báo | `/alerts` | Tất cả (ngưỡng: `ADMIN`) | KAN-67 |
| Hạ tầng | `/infrastructure` | `ADMIN`, `OPERATOR` | KAN-69 |
| Tài khoản | `/users` | `ADMIN` | KAN-68 |
| Cấu hình | `/settings` | `ADMIN` | KAN-70 |

## 9.4. Thành phần kỹ thuật
- Next.js (App Router), React, TypeScript, Tailwind CSS.
- Dữ liệu giả trong `web/src/lib/*-mock.ts`, kiểu dữ liệu trong `web/src/types/index.ts`.
- Chạy: `cd web`, `npm install`, `npm run dev`, mở http://localhost:3000.

## 9.5. Giới hạn hiện tại
- Chưa nối API thật. Backend đã có cảnh báo, ngưỡng, số liệu; còn chờ API đăng nhập, danh sách máy chủ, người dùng.
- Backend đăng nhập bằng email và mật khẩu, giao diện hiện dùng tên đăng nhập, sẽ đổi khi nối API.
- Phân quyền mới ở giao diện, Backend kiểm tra bằng JWT.
- Ngưỡng ở giao diện là ngưỡng chung, Backend dùng ngưỡng riêng từng máy.
- Thời gian thực đang mô phỏng, sẽ thay bằng Socket.IO.

## 9.6. Thiết kế
Figma: (dán link khi có)
