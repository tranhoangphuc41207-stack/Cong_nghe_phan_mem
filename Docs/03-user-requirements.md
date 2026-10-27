# 3. Yêu cầu quản lý người dùng

## 3.1. Mục đích
Mô tả yêu cầu quản lý tài khoản người dùng của AR-IMMS: ai được xem, thêm, đổi vai trò và khóa tài khoản. Nội dung này được ghi theo giao diện Web Admin hiện có (`web/`) và mô tả hệ thống ở `01-overview.md`.

## 3.2. Vai trò

| Vai trò | Quyền liên quan đến người dùng |
|---|---|
| `ADMIN` | Xem, thêm, đổi vai trò, khóa và mở khóa tài khoản |
| `OPERATOR` | Không truy cập trang quản lý tài khoản |
| `TECHNICIAN` | Không truy cập trang quản lý tài khoản |

Hệ thống xác thực bằng email/mật khẩu và JWT.

## 3.3. Yêu cầu chức năng

| Mã | Yêu cầu | Vai trò | Giao diện |
|---|---|---|---|
| USR-01 | Xem danh sách người dùng: tên đăng nhập, họ tên, vai trò, trạng thái | `ADMIN` | Xong (dữ liệu giả) |
| USR-02 | Thêm tài khoản gồm tên đăng nhập, họ tên, vai trò | `ADMIN` | Xong (dữ liệu giả) |
| USR-03 | Đổi vai trò của người dùng | `ADMIN` | Xong (dữ liệu giả) |
| USR-04 | Khóa và mở khóa tài khoản | `ADMIN` | Xong (dữ liệu giả) |
| USR-05 | Chặn vai trò khác truy cập trang quản lý tài khoản | Tất cả | Xong |

## 3.4. Quy tắc
- Tên đăng nhập không được trùng.
- Phải nhập đủ tên đăng nhập và họ tên khi thêm tài khoản.
- `ADMIN` không được tự đổi vai trò hoặc tự khóa tài khoản của mình.
- Vai trò chỉ gồm `ADMIN`, `OPERATOR`, `TECHNICIAN`.

## 3.5. Giới hạn hiện tại
- Giao diện dùng dữ liệu giả, chưa nối API người dùng của Backend.
- Backend đăng nhập bằng email, giao diện đang dùng tên đăng nhập, sẽ đổi khi nối API.
- Form thêm tài khoản chưa có mật khẩu và tài khoản bị khóa chưa bị chặn đăng nhập (cần Backend).
- Phân quyền mới ở giao diện, Backend kiểm tra bằng JWT.
