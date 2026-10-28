# 3. Yêu cầu người dùng

## 3.1 Mục đích

Mô tả yêu cầu của người dùng đối với phần Web Admin (đăng nhập và quản lý tài khoản) của hệ thống AR-IMMS.

## 3.2 Vai trò và quyền

| Vai trò | Quyền |
| :--- | :--- |
| **ADMIN** | Toàn quyền, gồm quản lý tài khoản, thêm/sửa/xóa máy chủ, đặt ngưỡng cảnh báo |
| **OPERATOR** | Xem máy chủ, số liệu, cảnh báo; đổi trạng thái máy chủ |
| **TECHNICIAN** | Xem máy chủ, số liệu, cảnh báo |

## 3.3 Dữ liệu người dùng

`id`, `fullName`, `email`, `role`, `isActive`, `createdAt`. 

*Lưu ý: Hệ thống không bao giờ trả về mật khẩu.*

## 3.4 Yêu cầu chức năng

| Mã | Yêu cầu | API | Vai trò |
| :--- | :--- | :--- | :--- |
| **USR-01** | Đăng nhập bằng email và mật khẩu | `POST /auth/login` | Tất cả |
| **USR-02** | Xem danh sách và chi tiết người dùng | `GET /users`<br>`GET /users/:id` | ADMIN |
| **USR-03** | Thêm người dùng (mật khẩu từ 6 ký tự) | `POST /users` | ADMIN |
| **USR-04** | Khóa và mở khóa tài khoản | `PATCH /users/:id/deactivate`<br>`PATCH /users/:id/activate` | ADMIN |
| **USR-05** | Đổi vai trò người dùng | `PATCH /users/:id/role` | ADMIN |

## 3.5 Quy tắc và mã lỗi

- **Token & Xác thực:**
  - Token hết hạn sau 1 ngày.
  - Mọi API (trừ đăng nhập) cần header `Authorization: Bearer <token>`.
- **Phân quyền & Vai trò:**
  - Vai trò mới có hiệu lực khi người đó đăng nhập lại; giao diện báo *"người dùng cần đăng nhập lại"*.
  - Không được tự đổi vai trò của chính mình.
- **Mã lỗi (HTTP Status Codes):**
  - **401:** Sai thông tin hoặc token hết hạn, giao diện điều hướng về trang đăng nhập.
  - **403:** Không có quyền.
  - **404:** Không tồn tại.
  - **409:** Trùng email hoặc tự đổi vai trò.
  - **400:** Dữ liệu sai định dạng.

## 3.6 Giao diện

- Trang đăng nhập, trang quản lý tài khoản (chỉ dành cho **ADMIN**), menu hiển thị theo vai trò.
- Thiết kế Figma: Login và Dashboard (1440x900).

## 3.7 Giới hạn

- Chưa có API nhật ký hoạt động (audit log).
- Phần hiện tại web dùng dữ liệu giả (mock data), chưa nối API thật.
