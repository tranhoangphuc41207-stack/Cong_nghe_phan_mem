# 8. Yêu cầu phi chức năng (Non-functional Requirements)

## 1. Mục đích và nguồn
Tài liệu mô tả các yêu cầu về chất lượng của hệ thống AR-IMMS (hiệu năng, sẵn sàng, bảo mật, độ tin cậy, mở rộng, khả dụng, bảo trì), mức độ đã đáp ứng trong mã nguồn hiện tại và cách kiểm tra.

- Nguồn yêu cầu: mục III.4 của tài liệu SRS (NFR-01 đến NFR-07).

- Cập nhật lần cuối: 26/10/2026. **Cần cập nhật lại khi Backend thay đổi.**


## 1.2 Bảng tổng hợp

| Mã | Nhóm | Yêu cầu | Tiêu chí đo | Hiện trạng |
|---|---|---|---|---|
| NFR-01 | Hiệu năng | Thu telemetry theo chu kỳ cấu hình, mặc định 5 giây. Server báo không khả dụng khi không nhận dữ liệu quá 90 giây | Khoảng cách giữa hai bản `recordedAt` liên tiếp khoảng 5 giây; sau 90 giây không có dữ liệu thì trạng thái server chuyển OFFLINE | |
| NFR-02 | Sẵn sàng | Hoạt động trong giờ làm việc dự kiến; thông báo người dùng khi server hoặc collector không khả dụng | Có cảnh báo khi Agent hoặc server ngừng gửi dữ liệu ||
| NFR-03 | Bảo mật | Xác thực truy cập, phân quyền theo vai trò, mTLS cho agent, audit mọi thay đổi cấu hình, cập nhật ticket và thao tác từ xa | Gọi API không token trả 401; sai vai trò trả 403; mỗi thay đổi có một dòng audit ||
| NFR-04 | Độ tin cậy | Agent thử lại khi gửi lỗi và tự tiếp tục sau khi kết nối lại; khử trùng cảnh báo; ticket theo vòng đời open, in-progress, resolved, closed | Mất kết nối rồi có lại không mất bản nào; không có hai cảnh báo mở cùng loại cho một server |  |
| NFR-05 | Mở rộng | Node mới xuất hiện trên Digital Twin và gửi telemetry trong 5 phút sau khi đăng ký, chỉ cần cấu hình credentials và địa chỉ endpoint, không sửa mã lõi | Thêm node mới chỉ bằng đăng ký server và đặt 3 biến cho Agent |  |
| NFR-06 | Khả dụng | Dashboard desktop-first bằng tiếng Anh và ứng dụng AR Android; giao diện responsive, hiển thị rõ sức khỏe server, chi tiết sự cố, hướng dẫn khắc phục | Người dùng mới tìm được thông tin server trong tối đa 3 lần bấm |  |
| NFR-07 | Bảo trì và an toàn | Hỗ trợ kiểm thử tự động, log tập trung, metric và cảnh báo cấu hình được; thao tác gây gián đoạn trong AR cần xác nhận và ghi audit | Có bộ kiểm thử chạy được; ngưỡng cảnh báo chỉnh được qua API | |

## 1.3. Chi tiết từng nhóm

### 1.3.1. Bảo mật (NFR-03)

| Nội dung | Hiện trạng | Bằng chứng |
|---|---|---|
| Xác thực người dùng | **Đã có** | Đăng nhập trả JWT, hết hạn sau 1 ngày (`auth.module.ts`) |
| Mật khẩu | **Đã có** | Băm bằng bcrypt, cost 10 (`users.service.ts`) |
| Phân quyền theo vai trò | **Đã có** | `@Roles(...)` và `RolesGuard` trên servers (thêm, sửa, xóa: ADMIN), users và audit-logs (ADMIN), alerts (ADMIN, OPERATOR) |
| Xác thực Agent | **Đã có** | Header `x-api-key`, so sánh bằng `timingSafeEqual` (`api-key.guard.ts`) |
| Audit log | **Đã có** | `AuditInterceptor` tự ghi mọi request POST, PUT, PATCH, DELETE thành công; đăng nhập đúng và sai được ghi riêng; trường mật khẩu bị loại khỏi nội dung ghi |
| mTLS | **Một phần** | Agent hỗ trợ (chứng chỉ client, kiểm tra chứng chỉ server). Backend chưa bật https; bản demo dùng API key qua http nên **đường truyền chưa được mã hóa** |
| Audit cập nhật ticket, thao tác từ xa | **Chưa có** | Backend chưa có module ticket và thao tác từ xa |

Lưu ý: dữ liệu Agent gửi (`/metrics`) và đăng nhập (`/auth`) cố ý không đi qua audit tự động, vì tần suất 5 giây một bản sẽ làm đầy bảng audit.

### 1.3.2. Hiệu năng và độ tin cậy (NFR-01, NFR-04)

- Agent đệm tối đa 720 bản (khoảng 1 giờ) khi mất kết nối và gửi bù từ cũ đến mới, tối đa 20 bản mỗi chu kỳ; khi đầy thì bỏ bản cũ nhất. Có 13 kiểm thử tự động cho Agent.
- Khử trùng cảnh báo: khi vượt ngưỡng mà đã có cảnh báo cùng loại đang mở (OPEN hoặc ACKNOWLEDGED) thì không tạo mới; khi về bình thường thì cảnh báo tự đóng (`alerts.service.ts`).
- **Rủi ro còn lại:** Backend chưa chống trùng bản ghi khi Agent gửi lại, nên có thể có hai dòng cùng `serverCode` và `recordedAt` trong bảng `history`.

### 1.3.3. Mở rộng (NFR-05)

Thêm một node: (1) ADMIN tạo server qua `POST /servers` để có `serverCode`; (2) chạy Agent trên node với `SERVER_CODE`, `API_KEY`, `BACKEND_URL`. Không phải sửa mã Backend.

### 1.3.4. Bảo trì và an toàn (NFR-07)

- Kiểm thử tự động: Agent có 13 test; Backend mới có test mẫu của NestJS, **chưa có test cho các module nghiệp vụ**.
- Log: Backend chỉ dùng `Logger` của NestJS ở module audit; **chưa có log tập trung**.
- Ngưỡng cảnh báo CPU và RAM chỉnh được theo từng server qua `PATCH /servers/:id/thresholds` (ADMIN). **Chưa có ngưỡng network.**

## 1.4. Cách kiểm tra

| Mã | Cách kiểm tra |
|---|---|
| NFR-01 | Chạy Agent 1 phút, xem bảng `history`: các dòng cách nhau khoảng 5 giây. Tắt Agent 90 giây, kiểm tra trạng thái server (hiện chưa đổi, xem mục 8.6) |
| NFR-03 | Gọi `GET /servers` không token: mong đợi 401. Đăng nhập bằng tài khoản TECHNICIAN rồi gọi `POST /servers`: mong đợi 403. Gọi `POST /metrics` sai `x-api-key`: mong đợi 401. Sau khi sửa một server, xem bảng `audit_logs` có dòng mới |
| NFR-04 | Tắt Backend 30 giây rồi bật lại, đếm số dòng trong `history` so với số bản Agent đã gửi (đã chạy thử với Backend giả: 18 bản liên tục, không mất) |
| NFR-05 | Tạo server mới, chạy Agent với mã đó, xem dòng mới trong `history` trong 5 phút |
| NFR-07 | Chạy `npm test` trong thư mục Agent (13 test) và trong Backend |

## 1.5. Khoảng trống và việc cần làm

| Việc | Thuộc | Người phụ trách đề xuất |
|---|---|---|
| Tác vụ định kỳ phát hiện mất dữ liệu quá 90 giây, đặt server OFFLINE và tạo cảnh báo | NFR-01, NFR-02 | Nhóm giám sát và cảnh báo |
| Chống ghi trùng `history` (unique `server_id` và `recorded_at`, trả 409 khi trùng) | NFR-04 | Backend |
| Bật https hoặc mTLS cho đường truyền Agent | NFR-03 | Backend và nhóm giám sát |
| Thêm cột `docker_info` và các cột phần cứng vào `database.sql` cho khớp mã (đang thiếu, `synchronize` đang tắt) | NFR-04, NFR-07 | Backend |
| Ngưỡng network và cột thời gian đóng cảnh báo | NFR-07 | Backend và nhóm cảnh báo |
| Viết kiểm thử cho các module nghiệp vụ Backend | NFR-07 | Cả nhóm |
| Nối web với API thật và Socket.IO (hiện dữ liệu giả, thời gian thực mô phỏng), rồi đo NFR-06 (số lần bấm) và NFR-05 (hiển thị node mới trên sơ đồ hạ tầng) | NFR-05, NFR-06 | Nhóm web |
