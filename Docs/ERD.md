# ERD.md: Mô tả thực thể và quan hệ của AR-IMMS

## 1. Tổng quan

Hệ thống có **7 thực thể**. Mỗi thực thể ứng với một bảng cùng tên.

| STT | Thực thể (bảng) | Mô tả ngắn | Lớp Entity | API |
|---|---|---|---|---|
| 1 | `users` | Tài khoản và vai trò | Đã có | Đã có |
| 2 | `servers` | Máy chủ, ngưỡng, phần cứng, bảo hành, mã marker | Đã có | Đã có |
| 3 | `history` | Lịch sử số liệu giám sát | Đã có | Đã có |
| 4 | `alerts` | Cảnh báo | Đã có | Đã có |
| 5 | `tickets` | Phiếu bảo trì | **đã có** | **Chưa có** |
| 6 | `maintenance_logs` | Lịch sử xử lý bảo trì | **đã có** | **Chưa có** |
| 7 | `audit_logs` | Nhật ký hoạt động | Đã có | Đã có |

## 2. Các giá trị cố định (Enum)

| Enum | Giá trị | Dùng ở | Ràng buộc |
|---|---|---|---|
| `Role` | `ADMIN`, `OPERATOR`, `TECHNICIAN` | `users.role` | CHECK ở cơ sở dữ liệu |
| `ServerStatus` | `ONLINE`, `OFFLINE`, `WARNING`, `UNKNOWN` | `servers.status` | CHECK ở cơ sở dữ liệu |
| `AlertType` | `HIGH_CPU`, `HIGH_RAM`, `DOCKER_DOWN` | `alerts.alert_type` | Do ứng dụng kiểm soát |
| `AlertSeverity` | `WARNING`, `CRITICAL` | `alerts.severity` | Do ứng dụng kiểm soát |
| `AlertStatus` | `OPEN`, `ACKNOWLEDGED`, `RESOLVED` | `alerts.status` | Do ứng dụng kiểm soát |
| `TicketStatus` | `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED` | `tickets.status` | CHECK ở cơ sở dữ liệu |
| `TicketPriority` | Mặc định `MEDIUM`; dữ liệu mẫu có `HIGH`. Dự kiến `LOW`, `MEDIUM`, `HIGH` | `tickets.priority` | Chưa ràng buộc |

---

## 3. Chi tiết từng thực thể

### 3.1 Thực thể `users`

**Mô tả:** Tài khoản người dùng. Mỗi tài khoản có một vai trò, quyết định các API được gọi. Tài khoản không bị xóa mà chỉ bị khóa để giữ lịch sử thao tác.

**Thuộc tính**
| Thuộc tính | Kiểu logic | Cho phép rỗng | Khóa | Mặc định | Mô tả |
|---|---|---|---|---|---|
| `id` | integer tự tăng | Không | Khóa chính | | Mã người dùng |
| `full_name` | string(100) | Không | | | Họ tên |
| `email` | string(150) | Không | Duy nhất | | Tên đăng nhập |
| `password_hash` | text | Không | | | Mật khẩu đã băm bcrypt, không bao giờ trả ra API |
| `role` | string(20) | Không | | | Vai trò, thuộc `Role` |
| `is_active` | boolean | Có | | true | Còn hoạt động hay đã bị khóa |
| `created_at` | datetime | Có | | giờ hiện tại | Thời điểm tạo |

**Quan hệ:** một người dùng có thể xác nhận nhiều cảnh báo (`alerts.acknowledged_by`), tạo nhiều phiếu (`tickets.created_by`), được giao nhiều phiếu (`tickets.assigned_to`), thực hiện nhiều dòng bảo trì (`maintenance_logs.user_id`), và có nhiều dòng nhật ký (`audit_logs.user_id`). Tất cả đều là quan hệ tùy chọn.

**Quy tắc nghiệp vụ**
- Email là duy nhất. Mật khẩu tối thiểu 6 ký tự khi tạo.
- Chỉ quản trị viên tạo, khóa, mở khóa tài khoản và đổi vai trò.
- Không tự đổi vai trò của chính mình.
- Cột `password_hash` mặc định không được đọc khi truy vấn thông thường.

**Cài đặt:** Entity `User` (`src/users/user.entity.ts`), module `users`, đủ API.

### 3.2 Thực thể `servers`

**Mô tả:** Máy chủ (thiết bị) được quản lý và giám sát. Lưu cả ngưỡng cảnh báo, thông tin phần cứng, bảo hành và mã marker để ứng dụng AR tra cứu.

**Thuộc tính**
| Thuộc tính | Kiểu logic | Cho phép rỗng | Khóa | Mặc định | Mô tả |
|---|---|---|---|---|---|
| `id` | integer tự tăng | Không | Khóa chính | | Mã nội bộ |
| `server_code` | string(50) | Không | Duy nhất | | Mã máy chủ, agent dùng khi gửi số liệu |
| `name` | string(100) | Không | | | Tên máy chủ |
| `description` | text | Có | | | Mô tả |
| `location` | string(200) | Có | | | Vị trí (phòng, rack) |
| `qr_code` | string(255) | Có | Duy nhất | | Mã QR hoặc marker |
| `status` | string(20) | Có | | `UNKNOWN` | Trạng thái, thuộc `ServerStatus` |
| `cpu_threshold` | decimal(5,2) | Có | | 80 | Ngưỡng cảnh báo CPU (%) |
| `ram_threshold` | decimal(5,2) | Có | | 80 | Ngưỡng cảnh báo RAM (%) |
| `manufacturer` | string(100) | Có | | | Hãng |
| `model` | string(100) | Có | | | Dòng máy |
| `serial_number` | string(100) | Có | Duy nhất | | Số serial |
| `cpu_model` | string(100) | Có | | | Loại CPU |
| `ram_gb` | integer | Có | | | RAM (GB) |
| `storage_gb` | integer | Có | | | Ổ đĩa (GB) |
| `purchase_date` | date | Có | | | Ngày mua |
| `warranty_expiry` | date | Có | | | Hạn bảo hành |
| `created_at` | datetime | Có | | giờ hiện tại | Thời điểm tạo |

**Quan hệ:** một máy chủ có nhiều lần đo (`history.server_id`), nhiều cảnh báo (`alerts.server_id`), nhiều phiếu bảo trì (`tickets.server_id`). Các quan hệ này bắt buộc ở phía bảng con.

**Quy tắc nghiệp vụ**
- `server_code`, `qr_code`, `serial_number` không được trùng (trùng thì báo xung đột).
- Ngưỡng là số từ 0 đến 100.
- Không xóa được máy chủ đã có lịch sử, cảnh báo hoặc phiếu bảo trì.
- Trạng thái tự chuyển `ONLINE` hoặc `WARNING` mỗi khi nhận số liệu; quản trị viên và nhân viên vận hành cũng đổi được thủ công.
- Danh sách "sắp hết bảo hành" gồm cả máy đã hết hạn.

**Cài đặt:** Entity `Server` (`src/servers/server.entity.ts`), module `servers`, đủ API.

### 3.3 Thực thể `history`

**Mô tả:** Mỗi dòng là một lần đo tình trạng máy chủ do agent gửi về. Bảng tăng nhanh nên dùng khóa chính số lớn.

**Thuộc tính**
| Thuộc tính | Kiểu logic | Cho phép rỗng | Khóa | Mặc định | Mô tả |
|---|---|---|---|---|---|
| `id` | bigint tự tăng | Không | Khóa chính | | Mã dòng |
| `server_id` | integer | Không | Khóa ngoại tới `servers.id` | | Máy chủ được đo |
| `cpu_usage` | decimal(5,2) | Có | | | CPU (%) |
| `ram_usage` | decimal(5,2) | Có | | | RAM (%) |
| `network_in` | bigint | Có | | | Lưu lượng vào (byte/giây) |
| `network_out` | bigint | Có | | | Lưu lượng ra (byte/giây) |
| `recorded_at` | datetime | Có | | giờ hiện tại | Thời điểm đo |
| `docker_info` | json | Có | | | Danh sách container: tên, trạng thái, CPU (%), bộ nhớ (MB) |

**Chỉ mục:** `idx_history_server_time` trên (`server_id`, `recorded_at` giảm dần).

**Quy tắc nghiệp vụ**
- Chỉ được ghi qua `POST /metrics` (agent), không có API sửa hoặc xóa.
- `cpu_usage`, `ram_usage` từ 0 đến 100.
- Ước lượng: agent gửi mỗi 10 giây thì mỗi máy chủ thêm 8.640 dòng mỗi ngày.

**Cài đặt:** Entity `History` (`src/metrics/history.entity.ts`), module `metrics`, đủ API.

### 3.4 Thực thể `alerts`

**Mô tả:** Cảnh báo do hệ thống tự sinh khi số liệu vượt ngưỡng hoặc container không chạy. Có vòng đời xử lý.

**Thuộc tính**
| Thuộc tính | Kiểu logic | Cho phép rỗng | Khóa | Mặc định | Mô tả |
|---|---|---|---|---|---|
| `id` | integer tự tăng | Không | Khóa chính | | Mã cảnh báo |
| `server_id` | integer | Không | Khóa ngoại tới `servers.id` | | Máy chủ phát sinh |
| `alert_type` | string(50) | Không | | | Loại, thuộc `AlertType` |
| `message` | text | Không | | | Nội dung cảnh báo |
| `severity` | string(20) | Có | | `WARNING` | Mức độ, thuộc `AlertSeverity` |
| `status` | string(20) | Có | | `OPEN` | Trạng thái, thuộc `AlertStatus` |
| `created_at` | datetime | Có | | giờ hiện tại | Thời điểm phát sinh |
| `acknowledged_by` | integer | Có | Khóa ngoại tới `users.id` | | Người xác nhận |
| `acknowledged_at` | datetime | Có | | | Thời điểm xác nhận |

**Chỉ mục:** `idx_alerts_server_status` trên (`server_id`, `status`).

**Quy tắc nghiệp vụ**
- Mức `CRITICAL` khi CPU hoặc RAM từ 95% trở lên, còn lại là `WARNING`.
- Mỗi cặp (máy chủ, loại) chỉ có một cảnh báo đang hoạt động (`OPEN` hoặc `ACKNOWLEDGED`). Không tạo trùng.
- Khi số liệu về bình thường, cảnh báo đang hoạt động tự chuyển `RESOLVED`.
- Vòng đời: `OPEN` sang `ACKNOWLEDGED` (chỉ từ `OPEN`) sang `RESOLVED`; `RESOLVED` có thể đến trực tiếp từ `OPEN`.

**Cài đặt:** Entity `Alert` (`src/alerts/alert.entity.ts`), module `alerts`, đủ API.

### 3.5 Thực thể `tickets`

**Mô tả:** Phiếu bảo trì cho một máy chủ, có thể sinh ra từ một cảnh báo, được giao cho một người xử lý.

**Thuộc tính**
| Thuộc tính | Kiểu logic | Cho phép rỗng | Khóa | Mặc định | Mô tả |
|---|---|---|---|---|---|
| `id` | integer tự tăng | Không | Khóa chính | | Mã phiếu |
| `ticket_code` | string(50) | Không | Duy nhất | | Mã phiếu hiển thị (ví dụ `TKT001`) |
| `server_id` | integer | Không | Khóa ngoại tới `servers.id` | | Máy chủ cần bảo trì |
| `alert_id` | integer | Có | Khóa ngoại tới `alerts.id` | | Cảnh báo dẫn tới phiếu |
| `title` | string(200) | Không | | | Tiêu đề |
| `description` | text | Có | | | Mô tả |
| `status` | string(20) | Có | | `OPEN` | Trạng thái, thuộc `TicketStatus` |
| `priority` | string(20) | Có | | `MEDIUM` | Mức ưu tiên |
| `created_by` | integer | Có | Khóa ngoại tới `users.id` | | Người tạo |
| `assigned_to` | integer | Có | Khóa ngoại tới `users.id` | | Người được giao |
| `created_at` | datetime | Có | | giờ hiện tại | Thời điểm tạo |
| `resolved_at` | datetime | Có | | | Thời điểm giải quyết |
| `closed_at` | datetime | Có | | | Thời điểm đóng |

**Chỉ mục:** `idx_tickets_assigned_status` trên (`assigned_to`, `status`).

**Quy tắc nghiệp vụ (dự kiến, chưa cài đặt)**
- Trạng thái đi theo thứ tự `OPEN`, `IN_PROGRESS`, `RESOLVED`, `CLOSED`.
- Ghi `resolved_at` khi chuyển `RESOLVED`, ghi `closed_at` khi chuyển `CLOSED`.
- Mã phiếu không được trùng.

**Cài đặt:** Chưa có Entity, chưa có API. Cần tạo module `tickets`.

### 3.6 Thực thể `maintenance_logs`

**Mô tả:** Từng bước xử lý của một phiếu bảo trì: ai làm gì, nguyên nhân, cách khắc phục, kết quả.

**Thuộc tính**
| Thuộc tính | Kiểu logic | Cho phép rỗng | Khóa | Mặc định | Mô tả |
|---|---|---|---|---|---|
| `id` | integer tự tăng | Không | Khóa chính | | Mã dòng |
| `ticket_id` | integer | Không | Khóa ngoại tới `tickets.id` | | Phiếu liên quan |
| `user_id` | integer | Có | Khóa ngoại tới `users.id` | | Người thực hiện |
| `action` | text | Không | | | Hành động đã làm |
| `root_cause` | text | Có | | | Nguyên nhân gốc |
| `corrective_action` | text | Có | | | Cách khắc phục |
| `result` | text | Có | | | Kết quả |
| `created_at` | datetime | Có | | giờ hiện tại | Thời điểm ghi |

**Quy tắc nghiệp vụ (dự kiến, chưa cài đặt):** chỉ thêm dòng mới, không sửa hoặc xóa, để giữ lịch sử.

**Cài đặt:** Chưa có Entity, chưa có API.

### 3.7 Thực thể `audit_logs`

**Mô tả:** Nhật ký hoạt động. Mỗi dòng ghi một thao tác của người dùng.

**Thuộc tính**
| Thuộc tính | Kiểu logic | Cho phép rỗng | Khóa | Mặc định | Mô tả |
|---|---|---|---|---|---|
| `id` | bigint tự tăng | Không | Khóa chính | | Mã dòng |
| `user_id` | integer | Có | Khóa ngoại tới `users.id` | | Người thực hiện, rỗng khi chưa xác định (ví dụ email lạ đăng nhập sai) |
| `action` | string(100) | Không | | | Hành động, ví dụ `CREATE_SERVER`, `LOGIN_FAILED` |
| `entity_type` | string(50) | Có | | | Loại đối tượng, ví dụ `SERVER`, `USER` |
| `entity_id` | integer | Có | | | Mã đối tượng bị tác động |
| `details` | text | Có | | | Chi tiết dạng JSON chuỗi, không chứa mật khẩu |
| `created_at` | datetime | Có | | giờ hiện tại | Thời điểm ghi |

**Quy tắc nghiệp vụ**
- Tự ghi cho mọi yêu cầu thêm, sửa, xóa thành công và mọi lần đăng nhập. Không ghi `/metrics`.
- Chỉ quản trị viên được xem. Không có API sửa hoặc xóa.

**Cài đặt:** Entity `AuditLog` (`src/audit-logs/audit-log.entity.ts`), module `audit-logs`, đủ API.

---

## 4. Tóm tắt quan hệ

| Bảng cha | Bảng con | Cột khóa ngoại | Số lượng | Bắt buộc ở bảng con | Khi xóa bảng cha |
|---|---|---|---|---|---|
| `servers` | `history` | `server_id` | 1 - N | Có | Từ chối nếu còn dòng con |
| `servers` | `alerts` | `server_id` | 1 - N | Có | Từ chối |
| `servers` | `tickets` | `server_id` | 1 - N | Có | Từ chối |
| `alerts` | `tickets` | `alert_id` | 1 - N | Không | Từ chối |
| `tickets` | `maintenance_logs` | `ticket_id` | 1 - N | Có | Từ chối |
| `users` | `alerts` | `acknowledged_by` | 1 - N | Không | Từ chối |
| `users` | `tickets` | `created_by` | 1 - N | Không | Từ chối |
| `users` | `tickets` | `assigned_to` | 1 - N | Không | Từ chối |
| `users` | `maintenance_logs` | `user_id` | 1 - N | Không | Từ chối |
| `users` | `audit_logs` | `user_id` | 1 - N | Không | Từ chối |

Không khai báo xóa dây chuyền ở bất kỳ khóa ngoại nào. Vì vậy xóa dòng cha còn dòng con sẽ bị cơ sở dữ liệu từ chối, và Backend trả mã 409.

---

## 5. Quy ước sinh mã từ ERD (cho agent)

**Với mỗi thực thể ở mục 4, sinh các thành phần sau**
| Thành phần | Tên tệp mẫu (thực thể `maintenance_logs`) | Nội dung |
|---|---|---|
| Entity | `src/maintenance-logs/maintenance-log.entity.ts` | Lớp ánh xạ bảng. Cột `snake_case` sang thuộc tính `camelCase` bằng `@Column({ name: '...' })` |
| DTO | `src/maintenance-logs/dto/create-maintenance-log.dto.ts` | Thuộc tính bắt buộc theo cột "Cho phép rỗng = Không". Kiểm tra bằng `class-validator` theo kiểu và độ dài |
| Service | `maintenance-logs.service.ts` | Nghiệp vụ theo mục "Quy tắc nghiệp vụ" |
| Controller | `maintenance-logs.controller.ts` | Đường dẫn, phương thức, phân quyền theo vai trò |
| Module | `maintenance-logs.module.ts` | Đăng ký Entity bằng `TypeOrmModule.forFeature([...])`, đăng ký vào `AppModule` |

**Quy tắc chung**
- Khóa ngoại khai báo kèm quan hệ ORM (`@ManyToOne` và `@JoinColumn`), không chỉ cột số.
- Cột `decimal` và `bigint` đọc ra dạng chuỗi, phải đổi sang số bằng bộ chuyển đổi (`transformer`).
- Không bao giờ trả `password_hash` ra API.
- Thực thể nào có "Không có API sửa hoặc xóa" thì không sinh các API đó.
- Giá trị trong mục 3 phải khai báo thành `enum` và dùng để kiểm tra DTO.
- Mọi thay đổi cấu trúc phải cập nhật tệp này, `schema.sql` và Entity cùng lúc.

---


