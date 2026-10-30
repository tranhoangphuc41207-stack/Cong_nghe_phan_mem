# 06\-alert\-requirements\.md

## 1. Mục đích và phạm vi

Module Cảnh báo phát hiện tình trạng bất thường của hạ tầng từ dữ liệu telemetry, tạo và cập nhật cảnh báo, cho phép Operator cấu hình ngưỡng và xử lý cảnh báo, rồi chuyển cảnh báo cần can thiệp thành ticket bảo trì.

**Trong phạm vi**

- Cấu hình ngưỡng cảnh báo (Operator).
- Tự động phát hiện bất thường: vượt ngưỡng CPU, RAM, Network; trạng thái container; mất kết nối (node không gửi telemetry quá 90 giây).
- Tạo, cập nhật, gộp cảnh báo trùng và quản lý vòng đời cảnh báo.
- Xem, lọc, xác nhận cảnh báo trên Web; tạo ticket từ cảnh báo.
- Đẩy cảnh báo theo thời gian thực qua <http://Socket.IO>  tới Web và Mobile AR.

**Ngoài phạm vi (thuộc module khác)**

- Thu thập telemetry (module `metrics`, Collector Agent): module này chỉ *nhận* dữ liệu để đánh giá.
- Vòng đời và nghiệp vụ ticket (module `ticket`): module này chỉ tạo ticket từ cảnh báo và nhận sự kiện đóng ticket.
- Ghi nhật ký kiểm toán (module `audit-logs`, file 07): module này gọi dịch vụ ghi log.

## 2. Tác nhân

| Tác nhân | Quyền với cảnh báo |
| --- | --- |
| System Operator | Toàn quyền trên Web: xem, lọc, cấu hình ngưỡng, xác nhận, đóng cảnh báo, tạo ticket |
| System Administrator | Chỉ xem số lượng cảnh báo đang mở trên Dashboard sức khỏe (SA-02, FR-A3). Không cấu hình ngưỡng, không xử lý cảnh báo |
| Technician | Chỉ xem cảnh báo của thiết bị đang xử lý trên Mobile AR (SM-05), chỉ đọc |
| Automated Monitoring System | Tạo và cập nhật cảnh báo, tự chuyển sang Resolved khi bình thường trở lại |

## 3. Yêu cầu chức năng

### 3.1 Cấu hình ngưỡng (FR-O5, UC-08)

| Mã | Yêu cầu | Ưu tiên |
| --- | --- | --- |
| ALT-FR-01 | Operator xem danh sách ngưỡng hiện hành theo phạm vi và chỉ số | Must |
| ALT-FR-02 | Operator tạo, sửa ngưỡng theo **chỉ số** (CPU, RAM, Network, trạng thái container) và **phạm vi** (toàn hệ thống, rack hoặc node) | Must |
| ALT-FR-03 | Mỗi ngưỡng có mức **Warning** và **Critical** và thời gian duy trì (giây) trước khi phát cảnh báo, để tránh cảnh báo do dao động ngắn | Must |
| ALT-FR-04 | Khi có nhiều ngưỡng cùng áp dụng cho một node, ưu tiên theo thứ tự: node, rack, toàn hệ thống (đề xuất) | Should |
| ALT-FR-05 | Kiểm tra hợp lệ: CPU và RAM trong khoảng 0–100%; ngưỡng Warning nhỏ hơn ngưỡng Critical; thời gian duy trì là số nguyên không âm | Must |
| ALT-FR-06 | Ngưỡng mới áp dụng cho các lần đánh giá telemetry kế tiếp, không cần khởi động lại hệ thống | Must |
| ALT-FR-07 | Mọi thay đổi ngưỡng ghi audit log gồm giá trị cũ và mới | Must |
| ALT-FR-08 | Hệ thống có bộ ngưỡng mặc định ban đầu (đề xuất: CPU và RAM Warning 70%, Critical 85%, khớp ngưỡng màu hiển thị ở Dashboard hiện tại) | Should |

### 3.2 Phát hiện bất thường (FR-M2, UC-15)

| Mã | Yêu cầu | Ưu tiên |
| --- | --- | --- |
| ALT-FR-10 | Với mỗi telemetry nhận được, Backend so sánh CPU, RAM, Network với ngưỡng áp dụng và xác định mức Normal, Warning hoặc Critical | Must |
| ALT-FR-11 | Chỉ phát cảnh báo khi giá trị vượt ngưỡng liên tục trong thời gian duy trì đã cấu hình | Must |
| ALT-FR-12 | Node không gửi telemetry quá **90 giây** được đặt trạng thái OFFLINE và tạo cảnh báo mất kết nối mức Critical | Must |
| ALT-FR-13 | Phát hiện container ngừng hoặc khởi động lại liên tục từ dữ liệu trạng thái Docker Container và tạo cảnh báo | Should |
| ALT-FR-14 | Khi node gửi lại telemetry sau khi OFFLINE, trạng thái trở về ONLINE hoặc WARNING tùy giá trị mới nhất | Must |
| ALT-FR-15 | Cảnh báo bảo hành sắp hết hạn tạo từ dữ liệu tài sản, số ngày báo trước cấu hình được (đề xuất mặc định 30 ngày) | Could |

### 3.3 Tạo, gộp và cập nhật cảnh báo (FR-M3)

| Mã | Yêu cầu | Ưu tiên |
| --- | --- | --- |
| ALT-FR-20 | Khi phát hiện bất thường, hệ thống tạo cảnh báo mới ở trạng thái **Open**, gắn mã cảnh báo duy nhất | Must |
| ALT-FR-21 | **Gộp cảnh báo trùng (Duplicate Alert Suppression):** nếu đã có cảnh báo đang Open hoặc Acknowledged cùng khóa (node + loại + chỉ số + container nếu có) thì không tạo mới; chỉ tăng số lần lặp, cập nhật thời điểm gần nhất, giá trị hiện tại | Must |
| ALT-FR-22 | Nếu mức độ tăng (Warning lên Critical) trong khi cảnh báo còn mở thì cập nhật mức độ của cảnh báo hiện có và đẩy sự kiện cập nhật | Must |
| ALT-FR-23 | Khi giá trị trở lại dưới ngưỡng Warning trong số lần lấy mẫu liên tiếp (đề xuất 3 lần) thì hệ thống tự chuyển cảnh báo sang **Resolved** | Must |
| ALT-FR-24 | Nếu bất thường tái phát khi cảnh báo đang Resolved nhưng chưa Closed thì mở lại (về Open) thay vì tạo cảnh báo mới (đề xuất) | Should |
| ALT-FR-25 | Cảnh báo đã Closed không bị mở lại; tái phát sau đó tạo cảnh báo mới | Must |

### 3.4 Vòng đời cảnh báo

```
            (hệ thống tạo)
                 │
                 ▼
              [Open] ──Operator xác nhận──► [Acknowledged]
                 │                               │
                 └──── bình thường trở lại ──────┤
                                                 ▼
                                            [Resolved] ──Operator đóng / ticket đóng──► [Closed]
                                                 │
                                    tái phát ────┘ (về Open, đề xuất)
```

| Chuyển trạng thái | Ai thực hiện | Điều kiện |
| --- | --- | --- |
| Open → Acknowledged | Operator | Có thể kèm ghi chú; lưu người xác nhận, thời điểm |
| Open / Acknowledged → Resolved | Hệ thống (tự động) hoặc Operator | Telemetry bình thường, hoặc ticket liên quan chuyển Resolved |
| Resolved → Closed | Operator | Operator đóng thủ công, hoặc tự động khi ticket liên quan được duyệt đóng (FR-O6) |
| Resolved → Open | Hệ thống | Tái phát trước khi Closed (đề xuất) |

Mọi chuyển trạng thái ghi audit log (xem file 07).

### 3.5 Xem và xử lý cảnh báo trên Web (SO-04)

| Mã | Yêu cầu | Ưu tiên |
| --- | --- | --- |
| ALT-FR-30 | Danh sách cảnh báo hiển thị: mã, node, loại, mức độ, thời điểm phát sinh, số lần lặp, trạng thái, ticket liên quan | Must |
| ALT-FR-31 | Thẻ thống kê số cảnh báo theo 4 trạng thái Open, Acknowledged, Resolved, Closed | Must |
| ALT-FR-32 | Lọc theo trạng thái, mức độ, node, khoảng thời gian; tìm theo mã cảnh báo; phân trang | Must |
| ALT-FR-33 | Cảnh báo mới và cảnh báo được cập nhật xuất hiện trên danh sách theo thời gian thực, không cần tải lại trang | Must |
| ALT-FR-34 | Xem chi tiết cảnh báo: giá trị ngưỡng, giá trị hiện tại, lịch sử thay đổi trạng thái, node liên quan | Must |
| ALT-FR-35 | Operator xác nhận cảnh báo (Acknowledge) | Must |
| ALT-FR-36 | Operator đóng cảnh báo đã Resolved | Must |
| ALT-FR-37 | Operator tạo ticket từ cảnh báo; ticket tự điền node, mô tả, mức độ và lưu tham chiếu đến cảnh báo gốc; cảnh báo hiển thị liên kết đến ticket | Must |
| ALT-FR-38 | Mỗi cảnh báo chỉ gắn một ticket đang mở tại một thời điểm (đề xuất) | Should |
| ALT-FR-39 | Dashboard (SA-02 và SO-01) hiển thị số cảnh báo đang mở (Open + Acknowledged) | Must |

### 3.6 Truyền thời gian thực (FR-M4)

| Mã | Yêu cầu | Ưu tiên |
| --- | --- | --- |
| ALT-FR-40 | Backend phát sự kiện <http://Socket.IO>  `alert.created`, `alert.updated` đến Web và Mobile AR đang kết nối | Must |
| ALT-FR-41 | Chỉ gửi sự kiện cho người dùng có quyền xem cảnh báo (Operator trên Web; Technician theo thiết bị được giao) | Should |
| ALT-FR-42 | Máy khách mất kết nối <http://Socket.IO>  phải tải lại dữ liệu mới nhất khi kết nối lại | Should |

## 4. Mô hình dữ liệu đề xuất

**Alert**

| Trường | Kiểu | Ghi chú |
| --- | --- | --- |
| id | UUID | Khóa chính |
| code | string | Mã hiển thị, duy nhất, ví dụ `ALT-20261028-0001` |
| nodeId | FK | Node phát sinh cảnh báo |
| type | enum | `THRESHOLD_EXCEEDED`, `NODE_OFFLINE`, `CONTAINER_DOWN`, `WARRANTY_EXPIRING` |
| metric | enum, null | `CPU`, `RAM`, `NETWORK`, `CONTAINER` |
| severity | enum | `WARNING`, `CRITICAL` |
| status | enum | `OPEN`, `ACKNOWLEDGED`, `RESOLVED`, `CLOSED` |
| dedupKey | string | node + loại + chỉ số + container; có chỉ mục |
| thresholdValue / currentValue | number, null | Ngưỡng bị vượt và giá trị hiện tại |
| message | string | Mô tả cảnh báo |
| firstOccurredAt / lastOccurredAt | datetime |  |
| occurrenceCount | int | Số lần lặp, bắt đầu là 1 |
| acknowledgedBy / acknowledgedAt | FK, datetime |  |
| resolvedAt, closedBy, closedAt |  |  |
| ticketId | FK, null | Ticket gắn với cảnh báo |

**AlertThreshold**

| Trường | Kiểu | Ghi chú |
| --- | --- | --- |
| id | UUID |  |
| scope / scopeId | enum, FK | `GLOBAL`, `RACK`, `NODE` |
| metric | enum | `CPU`, `RAM`, `NETWORK`, `CONTAINER` |
| warningValue, criticalValue | number |  |
| durationSeconds | int | Thời gian duy trì |
| enabled | boolean |  |
| updatedBy, updatedAt | FK, datetime |  |

## 5. API đề xuất (NestJS, tiền tố `/api/alerts`)

| Phương thức | Đường dẫn | Chức năng | Vai trò |
| --- | --- | --- | --- |
| GET | `/alerts` | Danh sách, lọc, phân trang | Operator |
| GET | `/alerts/summary` | Số lượng theo trạng thái | Operator, Administrator |
| GET | `/alerts/:id` | Chi tiết | Operator, Technician (theo thiết bị) |
| PATCH | `/alerts/:id/acknowledge` | Xác nhận | Operator |
| PATCH | `/alerts/:id/close` | Đóng | Operator |
| POST | `/alerts/:id/tickets` | Tạo ticket từ cảnh báo | Operator |
| GET | `/alert-thresholds` | Xem ngưỡng | Operator |
| PUT | `/alert-thresholds/:id` | Sửa ngưỡng | Operator |
| POST | `/alert-thresholds` | Thêm ngưỡng | Operator |

Quyền truy cập kiểm tra tại Backend bằng RBAC; ẩn menu ở Web chỉ để thuận tiện.

## 6. Yêu cầu phi chức năng

| Mã | Yêu cầu |
| --- | --- |
| ALT-NFR-01 | Từ lúc Backend nhận telemetry vượt ngưỡng đến lúc cảnh báo hiện trên Web không quá 10 giây ở điều kiện thử nghiệm Mini Data Center (đề xuất, cần đối chiếu NFR của nhóm) |
| ALT-NFR-02 | Phát hiện mất kết nối đúng ngưỡng 90 giây, sai lệch không quá một chu kỳ thu telemetry |
| ALT-NFR-03 | Gộp cảnh báo trùng phải hoạt động đúng khi nhiều telemetry đến đồng thời: không tạo hai cảnh báo cùng `dedupKey` đang mở (dùng ràng buộc duy nhất hoặc khóa giao dịch) |
| ALT-NFR-04 | Danh sách cảnh báo hỗ trợ phân trang phía Backend, thời gian phản hồi dưới 2 giây với 100.000 bản ghi (đề xuất) |
| ALT-NFR-05 | Truy cập API cảnh báo yêu cầu JWT hợp lệ và đúng vai trò (liên quan NFR-03) |
| ALT-NFR-06 | Bảng cảnh báo giữ lịch sử, không xóa vật lý; thời gian lưu trữ theo chính sách chung của hệ thống |

## 7. Tiêu chí chấp nhận (mẫu)

1. **Vượt ngưỡng:** Cho node có ngưỡng CPU Warning 70%, Critical 85%, thời gian duy trì 30 giây. Khi CPU ≥ 85% liên tục 30 giây, hệ thống tạo đúng một cảnh báo Critical trạng thái Open và Web hiển thị cảnh báo đó mà không cần tải lại.
2. **Gộp trùng:** Khi CPU tiếp tục vượt ngưỡng sau đó, không có cảnh báo mới; cảnh báo hiện có tăng số lần lặp và cập nhật thời điểm gần nhất.
3. **Mất kết nối:** Khi node không gửi dữ liệu 91 giây, node chuyển OFFLINE và có một cảnh báo `NODE_OFFLINE` mức Critical.
4. **Xác nhận:** Operator nhấn Acknowledge, trạng thái chuyển thành Acknowledged, ghi người xác nhận, thời điểm, và có một bản ghi audit log.
5. **Tự giải quyết:** Khi CPU xuống dưới 70% trong 3 lần lấy mẫu liên tiếp, cảnh báo chuyển sang Resolved.
6. **Ticket từ cảnh báo:** Operator chọn Create Ticket, ticket mới ở trạng thái Open, có tham chiếu cảnh báo gốc; mở lại cảnh báo thấy liên kết ticket.
7. **Phân quyền:** Administrator gọi API xác nhận cảnh báo nhận lỗi từ chối quyền; Technician gọi API sửa ngưỡng nhận lỗi từ chối quyền.
8. **Ngưỡng sai:** Nhập Warning 90, Critical 80 bị từ chối kèm thông báo lỗi.

