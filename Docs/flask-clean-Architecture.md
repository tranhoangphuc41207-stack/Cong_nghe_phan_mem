# Architecture
```bash
ar-imms-backend/
│
├── src/
│   │
│   ├── alerts/
│   │   ├── alert.entity.ts              # Định nghĩa cấu trúc bảng alerts trong PostgreSQL
│   │   ├── alerts.controller.ts         # Tiếp nhận API quản lý cảnh báo
│   │   ├── alerts.module.ts             # Đăng ký và liên kết các thành phần của module cảnh báo
│   │   └── alerts.service.ts             # Xử lý nghiệp vụ tạo, xem và cập nhật cảnh báo
│   │
│   ├── audit-logs/
│   │   ├── audit-log.entity.ts          # Định nghĩa cấu trúc bảng audit_logs trong PostgreSQL
│   │   ├── audit-logs.controller.ts     # Tiếp nhận API xem nhật ký hoạt động
│   │   ├── audit-logs.module.ts         # Đăng ký module nhật ký hoạt động
│   │   ├── audit-logs.service.ts        # Xử lý nghiệp vụ truy xuất nhật ký
│   │   └── audit.interceptor.ts         # Ghi nhận hoạt động của người dùng vào nhật ký
│   │
│   ├── auth/
│   │   ├── dto/
│   │   │   └── login.dto.ts             # Kiểm tra dữ liệu gửi lên khi đăng nhập
│   │   ├── auth.controller.ts           # Tiếp nhận API đăng nhập và xác thực
│   │   ├── auth.module.ts               # Đăng ký module xác thực
│   │   ├── auth.service.ts               # Xử lý đăng nhập, kiểm tra tài khoản và tạo JWT
│   │   ├── jwt-auth.guard.ts             # Bảo vệ API bằng token JWT
│   │   └── jwt.strategy.ts               # Kiểm tra và giải mã JWT
│   │
│   ├── common/
│   │   ├── role.enum.ts                  # Khai báo các vai trò ADMIN, OPERATOR, TECHNICIAN
│   │   ├── roles.decorator.ts            # Khai báo quyền truy cập cho từng API
│   │   └── roles.guard.ts                # Kiểm tra quyền truy cập theo vai trò
│   │
│   ├── metrics/
│   │   ├── dto/
│   │   │   └── create-metric.dto.ts     # Kiểm tra dữ liệu thông số máy chủ gửi lên
│   │   ├── api-key.guard.ts              # Xác thực API Key khi gửi thông số
│   │   ├── history.entity.ts             # Định nghĩa cấu trúc bảng history trong PostgreSQL
│   │   ├── metrics.controller.ts         # Tiếp nhận API gửi và xem thông số máy chủ
│   │   ├── metrics.module.ts             # Đăng ký module quản lý thông số
│   │   └── metrics.service.ts             # Xử lý lưu trữ và truy xuất thông số máy chủ
│   │
│   ├── servers/
│   │   ├── dto/
│   │   │   ├── create-server.dto.ts      # Kiểm tra dữ liệu khi tạo máy chủ
│   │   │   ├── update-server.dto.ts      # Kiểm tra dữ liệu khi cập nhật máy chủ
│   │   │   ├── update-status.dto.ts      # Kiểm tra dữ liệu khi cập nhật trạng thái
│   │   │   └── update-thresholds.dto.ts  # Kiểm tra ngưỡng CPU và RAM
│   │   ├── server-status.enum.ts         # Khai báo các trạng thái máy chủ
│   │   ├── server.entity.ts              # Định nghĩa cấu trúc bảng servers trong PostgreSQL
│   │   ├── servers.controller.ts         # Tiếp nhận API quản lý máy chủ
│   │   ├── servers.module.ts             # Đăng ký module quản lý máy chủ
│   │   └── servers.service.ts             # Xử lý nghiệp vụ thêm, sửa, xóa và truy vấn máy chủ
│   │
│   ├── users/
│   │   ├── dto/
│   │   │   └── update-user-role.dto.ts  # Kiểm tra dữ liệu khi thay đổi vai trò người dùng
│   │   ├── user.entity.ts                # Định nghĩa cấu trúc bảng users trong PostgreSQL
│   │   ├── users.controller.ts           # Tiếp nhận API quản lý người dùng
│   │   ├── users.module.ts               # Đăng ký module quản lý người dùng
│   │   └── users.service.ts               # Xử lý nghiệp vụ quản lý tài khoản
│   │
│   ├── app.controller.ts                 # Tiếp nhận các API chung của ứng dụng
│   ├── app.controller.spec.ts             # Kiểm thử AppController
│   ├── app.module.ts                      # Module gốc, cấu hình PostgreSQL và liên kết các module
│   ├── app.service.ts                      # Xử lý nghiệp vụ chung của ứng dụng
│   └── main.ts                            # Điểm khởi chạy, cấu hình CORS, validation và Swagger
│
├── test/
│   ├── app.e2e-spec.ts                    # Kiểm thử hoạt động API theo luồng thực tế
│   └── jest-e2e.json                      # Cấu hình kiểm thử End-to-End
│
```
## ORM-Object Relational Mapping
Cơ chế hoạt động:

Ánh xạ lớp thành bảng: Mỗi lớp Entity đại diện cho một bảng trong cơ sở dữ liệu.

Ánh xạ thuộc tính thành cột: Các thuộc tính của lớp Entity tương ứng với các cột dữ liệu trong bảng.

Ánh xạ khóa chính và khóa ngoại: Xác định định danh của từng bản ghi và liên kết dữ liệu giữa các bảng.

Ánh xạ mối quan hệ: Hỗ trợ các kiểu quan hệ One-to-One (một-một), One-to-Many (một-nhiều), Many-to-One (nhiều-một) và Many-to-Many (nhiều-nhiều).

Thao tác dữ liệu: Hỗ trợ thêm, sửa, xóa và truy vấn dữ liệu thông qua Entity và Repository mà không cần viết toàn bộ câu lệnh SQL thủ công.

Áp dụng trong dự án:

Các Entity như User, Server, Alert, History và AuditLog được ánh xạ tương ứng với các bảng dữ liệu trong PostgreSQL. Thông qua TypeORM, các lớp Service có thể thao tác với dữ liệu bằng Repository, giúp kết nối giữa xử lý nghiệp vụ và cơ sở dữ liệu.

Lợi ích:

Giảm số lượng câu lệnh SQL phải viết thủ công.

Giúp mô hình dữ liệu trong mã nguồn thống nhất với cấu trúc cơ sở dữ liệu.

Quản lý các mối quan hệ giữa các thực thể rõ ràng.

Tăng khả năng bảo trì và mở rộng hệ thống.

Hỗ trợ làm việc với nhiều hệ quản trị cơ sở dữ liệu khác nhau thông qua cấu hình phù hợp.
