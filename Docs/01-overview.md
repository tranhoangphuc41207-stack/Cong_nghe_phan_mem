# 1. Tổng quan hệ thống AR-IMMS

## 1.1. Mục đích
AR-IMMS cung cấp API quản lý hạ tầng máy chủ, gồm thông tin máy chủ, người dùng, dữ liệu giám sát, cảnh báo và nhật ký hoạt động. Nội dung này được suy ra từ mã nguồn Backend NestJS hiện có.

## 1.2. Phạm vi đã thấy trong mã nguồn
- Xác thực người dùng bằng email/mật khẩu và JWT.
- Phân quyền theo vai trò `ADMIN`, `OPERATOR`, `TECHNICIAN`.
- Quản lý thông tin máy chủ, trạng thái, ngưỡng CPU/RAM và thời hạn bảo hành.
- Tiếp nhận số liệu giám sát từ agent bằng API key.
- Lưu lịch sử chỉ số và đánh giá điều kiện cảnh báo.
- Tra cứu, xác nhận và đóng cảnh báo.
- Ghi và tra cứu nhật ký hoạt động.

## 1.3. Thành phần kỹ thuật
- Backend: NestJS, TypeScript.
- ORM: TypeORM.
- Cơ sở dữ liệu cấu hình: PostgreSQL.
- Xác thực: JWT; agent gửi dữ liệu sử dụng API key.
- Tài liệu API: Swagger được cấu hình tại `/api`.

## 1.4. Tác nhân và vai trò
- `ADMIN`: có quyền quản trị người dùng, tạo/sửa/xóa máy chủ, thay đổi ngưỡng và truy vấn audit log.
- `OPERATOR`: được phép cập nhật trạng thái máy chủ và xử lý cảnh báo.
- `TECHNICIAN`: vai trò được định nghĩa trong enum; quyền cụ thể phụ thuộc từng endpoint và guard. Không nên suy ra thêm quyền ngoài code.

## 1.5. Quy ước phân tích
Tài liệu này được lập sau khi code đã tồn tại. Vì vậy, mô tả chức năng được truy ngược từ controller, service, DTO và entity. Đây là bản baseline theo hiện trạng code, không thay thế việc xác nhận yêu cầu nghiệp vụ ban đầu với giảng viên/nhóm.

## 1.6. Ngoài phạm vi xác nhận
Không có đủ căn cứ trong các file đã kiểm tra để khẳng định giao diện Frontend, quy trình nghiệp vụ đầy đủ, SLA, hiệu năng mục tiêu hoặc mọi trường hợp kiểm thử đã hoàn thành.
