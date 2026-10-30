# 07\-audit\-logs\-requirements\.md

## 1. Mục đích và phạm vi

Audit log ghi lại **ai đã làm gì, lên đối tượng nào, lúc nào, kết quả ra sao** để phục vụ truy vết, kiểm toán và điều tra sự cố. Module gồm hai phần:

1. **Ghi log tự động (chức năng nền):** các module khác gọi dịch vụ ghi log khi có thao tác cần kiểm toán; người dùng không thao tác trực tiếp.
2. **Xem log (SA-06):** Administrator xem, lọc, tìm kiếm. Màn hình chỉ đọc.

**Ngoài phạm vi**

- Log kỹ thuật của ứng dụng (lỗi hệ thống, debug) và log container của workload: không thuộc audit log.
- Lịch sử dịch vụ của thiết bị (maintenance history) và dòng thời gian của ticket: là dữ liệu nghiệp vụ riêng, không thay thế audit log.

## 2. Tác nhân

| Tác nhân | Quyền với audit log |
| --- | --- |
| System Administrator | Xem, lọc, tìm kiếm audit log (UC-04). Không sửa, không xóa |
| System Operator, Technician | Không có quyền truy cập màn hình và API audit log |
| Các module Backend | Ghi log thông qua `AuditLogService` |
| Automated Monitoring System | Cũng là nguồn sinh log (hành động của hệ thống, `actor` là `SYSTEM`) |

## 3. Yêu cầu chức năng

### 3.1 Ghi nhật ký

| Mã | Yêu cầu | Ưu tiên |
| --- | --- | --- |
| AUD-FR-01 | Hệ thống tự ghi một bản ghi audit log cho mỗi thao tác thuộc danh mục ở mục 4 | Must |
| AUD-FR-02 | Mỗi bản ghi gồm: thời gian, người thực hiện (id, tên đăng nhập, vai trò), hành động, loại và mã đối tượng, giá trị cũ và mới (nếu có thay đổi), kết quả (thành công hoặc thất bại), địa chỉ IP, nguồn (Web, Mobile, System) | Must |
| AUD-FR-03 | Ghi cả thao tác **thất bại** có ý nghĩa bảo mật, ví dụ đăng nhập sai, truy cập bị từ chối do thiếu quyền | Must |
| AUD-FR-04 | Với thao tác cập nhật, lưu giá trị cũ và mới của **các trường thay đổi** (không lưu toàn bộ bản ghi nếu không cần) | Must |
| AUD-FR-05 | **Không** ghi dữ liệu nhạy cảm vào log: mật khẩu, mã băm mật khẩu, JWT, khóa mTLS. Trường nhạy cảm chỉ ghi nhận “đã thay đổi” | Must |
| AUD-FR-06 | Thao tác nghiệp vụ và việc ghi log của thao tác đó phải cùng thành công hoặc cùng thất bại (cùng giao dịch) đối với các thao tác quan trọng: tài khoản, vai trò, cấu hình, ngưỡng, đóng ticket (đề xuất) | Should |
| AUD-FR-07 | Thời gian ghi theo UTC, giao diện hiển thị theo múi giờ của người dùng (đề xuất) | Should |
| AUD-FR-08 | Hành động do hệ thống tự thực hiện (tự tạo cảnh báo, tự Resolved, đánh dấu node OFFLINE) ghi với người thực hiện là `SYSTEM` | Should |

### 3.2 Xem, lọc, tìm kiếm (FR-A5, SA-06)

| Mã | Yêu cầu | Ưu tiên |
| --- | --- | --- |
| AUD-FR-10 | Administrator xem bảng nhật ký sắp xếp mới nhất trước, gồm: Thời gian, Người dùng, Hành động, Đối tượng, Kết quả | Must |
| AUD-FR-11 | Lọc theo khoảng thời gian, người dùng, loại hành động, loại đối tượng, kết quả | Must |
| AUD-FR-12 | Tìm kiếm theo từ khóa trên mã đối tượng, tên đăng nhập hoặc mô tả | Must |
| AUD-FR-13 | Phân trang phía Backend (20, 50, 100 dòng mỗi trang) | Must |
| AUD-FR-14 | Xem chi tiết một bản ghi, gồm giá trị cũ và mới dưới dạng so sánh | Must |
| AUD-FR-15 | Xem **lịch sử thay đổi cấu hình**: lọc nhanh các hành động nhóm cấu hình (cấu hình hệ thống, ngưỡng, môi trường) | Must |
| AUD-FR-16 | Xuất kết quả lọc ra CSV (đề xuất, không có trong SRS) | Could |

### 3.3 Tính toàn vẹn (bất biến)

| Mã | Yêu cầu | Ưu tiên |
| --- | --- | --- |
| AUD-FR-20 | Audit log **chỉ đọc**: không có API và không có thao tác giao diện để sửa hoặc xóa bản ghi (SRS, mục 3.1.9) | Must |
| AUD-FR-21 | Tài khoản kết nối cơ sở dữ liệu của ứng dụng không có quyền `UPDATE` và `DELETE` trên bảng audit log (đề xuất) | Should |
| AUD-FR-22 | Mọi truy cập màn hình hoặc API audit log của Administrator cũng được ghi lại (đề xuất) | Could |
| AUD-FR-23 | Chính sách lưu trữ: giữ log theo thời hạn cấu hình; việc lưu trữ hay dọn dẹp chỉ do tác vụ hệ thống thực hiện, không do người dùng (đề xuất; thời hạn cần thống nhất) | Could |

## 4. Danh mục hành động cần ghi log

| Nhóm | Hành động (`action`) | Module phát sinh |
| --- | --- | --- |
| Xác thực | `AUTH_LOGIN_SUCCESS`, `AUTH_LOGIN_FAILED`, `AUTH_LOGOUT`, `ACCESS_DENIED` | `auth` (file 02) |
| Người dùng | `USER_CREATE`, `USER_UPDATE`, `USER_ROLE_CHANGE`, `USER_PASSWORD_RESET`, `USER_DEACTIVATE`, `USER_ACTIVATE` | `user` (file 03) |
| Cấu hình | `CONFIG_UPDATE`, `ENVIRONMENT_CREATE`, `ENVIRONMENT_UPDATE`, `ENVIRONMENT_DEACTIVATE` | `config`, `environment` |
| Thiết bị | `RACK_CREATE`, `SERVER_CREATE`, `DEVICE_UPDATE`, `DEVICE_DEACTIVATE`, `MARKER_ASSIGN` | `server` (file 04) |
| Cảnh báo | `THRESHOLD_UPDATE`, `ALERT_ACKNOWLEDGE`, `ALERT_RESOLVE`, `ALERT_CLOSE`, `ALERT_AUTO_CREATE`, `NODE_OFFLINE_DETECTED` | `alert` (file 06) |
| Ticket | `TICKET_CREATE`, `TICKET_ASSIGN`, `TICKET_STATUS_CHANGE`, `TICKET_CLOSURE_REQUEST`, `TICKET_CLOSURE_APPROVE`, `TICKET_CLOSURE_REJECT` | `ticket` |
| Tài sản | `ASSET_UPDATE`, `MAINTENANCE_RECORD_CREATE` | `asset` |

Danh mục này là gợi ý; mỗi người phụ trách module liên quan xác nhận các hành động của mình, vì đây là chỗ các module phải thống nhất tên hành động.

## 5. Mô hình dữ liệu đề xuất

**AuditLog**

| Trường | Kiểu | Ghi chú |
| --- | --- | --- |
| id | UUID | Khóa chính |
| occurredAt | datetime (UTC) | Có chỉ mục, dùng sắp xếp và lọc |
| actorId | FK, null | `null` khi `SYSTEM` hoặc đăng nhập sai tài khoản không tồn tại |
| actorUsername | string | Lưu cả tên để còn dấu vết khi tài khoản bị vô hiệu hóa |
| actorRole | enum | `ADMIN`, `OPERATOR`, `TECHNICIAN`, `SYSTEM` |
| action | enum | Theo mục 4; có chỉ mục |
| entityType | string | Ví dụ `USER`, `ALERT`, `TICKET`, `SERVER`, `CONFIG` |
| entityId | string, null |  |
| oldValue / newValue | JSON, null | Chỉ các trường thay đổi, đã loại dữ liệu nhạy cảm |
| result | enum | `SUCCESS`, `FAILURE` |
| failureReason | string, null | Ví dụ “Sai mật khẩu”, “Không đủ quyền” |
| ipAddress | string |  |
| source | enum | `WEB`, `MOBILE`, `SYSTEM` |
| requestId | string, null | Liên kết các log cùng một yêu cầu (đề xuất) |

Chỉ mục gợi ý: `occurredAt`, `(actorId, occurredAt)`, `(action, occurredAt)`, `(entityType, entityId)`.

## 6. API đề xuất (NestJS, tiền tố `/api/audit-logs`)

| Phương thức | Đường dẫn | Chức năng | Vai trò |
| --- | --- | --- | --- |
| GET | `/audit-logs` | Danh sách, lọc, tìm kiếm, phân trang | Administrator |
| GET | `/audit-logs/:id` | Chi tiết một bản ghi | Administrator |
| GET | `/audit-logs/export` | Xuất CSV (nếu làm AUD-FR-16) | Administrator |

Tham số lọc: `from`, `to`, `actorId`, `action`, `entityType`, `result`, `q`, `page`, `pageSize`.

Không có `POST`, `PUT`, `PATCH`, `DELETE` công khai. Việc ghi log chỉ thực hiện nội bộ qua `AuditLogService.record(...)`.

Giao diện nội bộ gợi ý cho các module khác:

ts

```
auditLog.record({
  actor,                      // người dùng hiện tại hoặc SYSTEM
  action: "USER_ROLE_CHANGE",
  entityType: "USER",
  entityId: user.id,
  oldValue: { role: "OPERATOR" },
  newValue: { role: "ADMIN" },
  result: "SUCCESS",
});
```

## 7. Yêu cầu phi chức năng

| Mã | Yêu cầu |
| --- | --- |
| AUD-NFR-01 | Chỉ Administrator truy cập được audit log, kiểm tra tại Backend theo RBAC (NFR-03) |
| AUD-NFR-02 | Ghi log không làm chậm thao tác chính đáng kể: dưới 50 ms cho mỗi bản ghi trong điều kiện thử nghiệm (đề xuất) |
| AUD-NFR-03 | Truy vấn có lọc trả về dưới 2 giây với tối thiểu 1 triệu bản ghi nhờ chỉ mục và phân trang (đề xuất) |
| AUD-NFR-04 | Nếu không ghi được audit log của thao tác quan trọng thì thao tác đó phải thất bại, không được âm thầm bỏ qua (AUD-FR-06) |
| AUD-NFR-05 | Bản ghi không bị sửa hoặc xóa qua ứng dụng; có biện pháp ở tầng cơ sở dữ liệu (AUD-FR-21) |
| AUD-NFR-06 | Dữ liệu nhạy cảm không xuất hiện trong log (AUD-FR-05), kể cả khi thao tác thất bại |

## 8. Tiêu chí chấp nhận (mẫu)

1. **Đăng nhập thành công:** Sau khi `admin` đăng nhập, có bản ghi `AUTH_LOGIN_SUCCESS`, người dùng `admin`, kết quả SUCCESS, có IP.
2. **Đăng nhập sai:** Nhập sai mật khẩu, có bản ghi `AUTH_LOGIN_FAILED`, kết quả FAILURE, lý do “Sai mật khẩu”, không chứa mật khẩu đã nhập.
3. **Đổi vai trò:** Administrator đổi vai trò một tài khoản, bản ghi `USER_ROLE_CHANGE` chứa giá trị cũ và mới của vai trò.
4. **Đổi cấu hình:** Đổi chu kỳ thu telemetry từ 5 giây sang 10 giây, bản ghi `CONFIG_UPDATE` hiển thị đúng hai giá trị.
5. **Lọc:** Lọc theo người dùng và khoảng thời gian chỉ trả về bản ghi thỏa cả hai điều kiện, sắp xếp mới nhất trước.
6. **Chỉ đọc:** Không có nút hay API sửa, xóa; gọi trực tiếp `DELETE /audit-logs/:id` trả về lỗi không tồn tại hoặc không cho phép.
7. **Phân quyền:** Operator mở `/audit-logs` nhận lỗi từ chối quyền; menu “Audit log” không hiển thị với Operator.
8. **Hệ thống tự thực hiện:** Khi node OFFLINE do mất kết nối, có bản ghi với người thực hiện `SYSTEM`.

