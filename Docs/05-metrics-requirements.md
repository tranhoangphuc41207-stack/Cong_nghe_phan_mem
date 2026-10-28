# 05\-metrics\-requirements\.md

# 05. Yêu cầu thu thập và giám sát số liệu (Metrics Requirements)

## 1. Mục đích

Tài liệu này mô tả yêu cầu thu thập, truyền, tiếp nhận, lưu trữ và cung cấp dữ liệu giám sát (telemetry) của AR-IMMS. Dữ liệu hỗ trợ System Operator theo dõi tình trạng Server/Node theo thời gian thực và tra cứu lịch sử vận hành.

## 2. Phạm vi và trách nhiệm

### 2.1. Trong phạm vi

- Thu thập CPU, RAM, Network và trạng thái Docker Container qua Collector Agent.
- Gửi telemetry từ Agent đến Backend theo chu kỳ cấu hình.
- Xác định Server/Node tương ứng và lưu lịch sử dữ liệu.
- Cung cấp dữ liệu thời gian thực qua <http://Socket.IO> .
- Hỗ trợ truy vấn và hiển thị telemetry lịch sử.
- Hỗ trợ Agent gửi lại dữ liệu sau khi kết nối được khôi phục.

### 2.2. Ranh giới với các module khác

- Quản lý Server/Node và thông tin thiết bị: `04-server-requirements.md`.
- Đánh giá ngưỡng, phát hiện bất thường, đặt Node `OFFLINE` và quản lý cảnh báo: `06-alert-requirements.md`.
- Xác thực người dùng và Agent: `02-auth-requirements.md`.
- Các yêu cầu phi chức năng và hiện trạng triển khai: `08-non-functional-requirements.md`.
- Audit log không ghi từng mẫu telemetry định kỳ; các sự kiện cần kiểm toán được quy định trong `07-audit-logs-requirements.md`.

## 3. Thành phần và tham chiếu SRS

| Thành phần/tác nhân | Trách nhiệm |
| --- | --- |
| Collector Agent | Thu thập CPU, RAM, Network và trạng thái Docker Container; gửi telemetry theo chu kỳ. |
| Backend | Xác thực yêu cầu Agent, tiếp nhận và liên kết dữ liệu với Server/Node, lưu lịch sử và phát dữ liệu cập nhật. |
| System Operator (OPERATOR) | Xem telemetry thời gian thực và truy vấn lịch sử theo phạm vi/thời gian. |
| Automated Monitoring System | Sử dụng telemetry để đánh giá tình trạng bất thường theo `06-alert-requirements.md`. |

**Tham chiếu SRS:** FR-M1, FR-M4, FR-O3; UC-07, UC-15; BR-07, BR-08, BR-16; NFR-01 và NFR-04.

## 4. Dữ liệu telemetry

| Dữ liệu | Yêu cầu sử dụng |
| --- | --- |
| Định danh Server/Node (`serverCode`) | Gắn mẫu telemetry với đúng thiết bị đã đăng ký. |
| CPU | Ghi nhận và cung cấp mức sử dụng CPU. |
| RAM | Ghi nhận và cung cấp mức sử dụng RAM. |
| Network | Ghi nhận các thông số mạng mà Collector Agent hỗ trợ. |
| Docker Container | Lưu thông tin trạng thái Container do Agent thu thập; dữ liệu Docker trong lịch sử được mô tả là JSONB trong tổng quan dự án. |
| Thời điểm ghi nhận (`recordedAt`) | Xác định thời điểm của mẫu dữ liệu, sắp xếp lịch sử và hỗ trợ đánh giá độ mới của telemetry. |

Tên trường chi tiết và kiểu dữ liệu của payload phải thống nhất với DTO/API đang sử dụng; không tự thêm trường ngoài hợp đồng dữ liệu của dự án.

## 5. Yêu cầu chức năng

### MET-01. Thu thập và truyền telemetry

**Tham chiếu:** FR-M1, BR-07. **Ưu tiên:** Cao.

Collector Agent thu thập CPU, RAM, Network và trạng thái Docker Container theo chu kỳ cấu hình, mặc định 5 giây/lần, rồi gửi dữ liệu đến Backend qua API nhận telemetry (`POST /metrics`).

Theo FR-M1 của SRS, kết nối Agent–Backend phải sử dụng mTLS. Agent đồng thời dùng cơ chế xác thực được quy định trong `02-auth-requirements.md`. API key xác thực Agent và mTLS bảo vệ kênh truyền; hiện trạng triển khai của mTLS được đánh giá riêng trong NFR-03.

**Kết quả mong đợi:** Backend nhận được mẫu telemetry hợp lệ theo chu kỳ và xác định được Server/Node cùng thời điểm ghi nhận.

### MET-02. Tiếp nhận và liên kết dữ liệu

**Tham chiếu:** FR-M1, FR-M4.

Backend phải kiểm tra định dạng payload và xác định Server/Node thông qua `serverCode` trước khi lưu dữ liệu. Mẫu không thể liên kết với Server/Node đã đăng ký phải bị từ chối; dữ liệu không được ghi vào nhầm thiết bị.

**Kết quả mong đợi:** Mẫu hợp lệ được liên kết đúng Server/Node; yêu cầu sai định dạng hoặc có mã Server/Node không hợp lệ trả lỗi phù hợp theo quy ước API.

### MET-03. Lưu lịch sử telemetry

**Tham chiếu:** FR-M4, UC-07.

Backend phải lưu các mẫu telemetry đã tiếp nhận để phục vụ truy vấn lịch sử. Mỗi bản ghi phải giữ được định danh Server/Node và thời điểm ghi nhận; thông tin Docker được lưu theo cấu trúc dữ liệu đã thống nhất của hệ thống.

**Kết quả mong đợi:** Dữ liệu đã lưu có thể được truy vấn lại theo Server/Node và thời gian, với thứ tự thời gian rõ ràng.

### MET-04. Cung cấp dữ liệu thời gian thực

**Tham chiếu:** FR-M4, FR-O3, UC-07.

Backend sử dụng <http://Socket.IO>  để phát dữ liệu telemetry mới đến giao diện Web đang kết nối. Sự kiện phải gắn với đúng Server/Node để Dashboard không hiển thị dữ liệu nhầm thiết bị. Quyền truy cập của các kết nối tuân theo `02-auth-requirements.md` và quy tắc phân quyền trong SRS.

**Kết quả mong đợi:** Khi có mẫu mới và kết nối đang hoạt động, giao diện nhận được dữ liệu tương ứng mà không cần tải lại toàn bộ trang.

### MET-05. Xem telemetry thời gian thực

**Tham chiếu:** FR-O3, UC-07, SO-01. **Ưu tiên:** Cao.

Dashboard telemetry cho phép OPERATOR theo dõi tình trạng Server/Node trong Mini Data Center.

- Hiển thị CPU, RAM và Network theo thời gian thực.
- Cho phép chọn Node hoặc Rack cần xem.
- Hiển thị số lượng cảnh báo đang mở như thông tin tổng quan; danh sách và thao tác xử lý cảnh báo thuộc tài liệu 06.
- Cho phép điều hướng đến chi tiết Node hoặc Digital Twin.
- Khi dữ liệu đã quá cũ, giao diện phải phản ánh trạng thái được cung cấp bởi module cảnh báo/thành phần quản lý trạng thái, không coi mẫu cũ là dữ liệu hiện tại.

**Kết quả mong đợi:** Dữ liệu hiển thị đúng thiết bị và được cập nhật khi nhận mẫu mới; trạng thái dữ liệu cũ được thể hiện rõ ràng.

### MET-06. Truy vấn telemetry lịch sử

**Tham chiếu:** FR-O3, UC-07, BR-16, SO-01.

OPERATOR có thể chọn phạm vi Node/Rack và khoảng thời gian để xem dữ liệu lịch sử.

- Các khoảng thời gian được nêu trong SRS gồm 1 giờ, 24 giờ, 7 ngày hoặc khoảng thời gian tùy chỉnh.
- Hiển thị biểu đồ lịch sử CPU, RAM và Network.
- Nếu không có dữ liệu trong phạm vi được chọn, hiển thị thông báo `No data`.
- Theo tổng quan dự án, danh sách lịch sử mặc định trả về 100 mẫu mới nhất và hỗ trợ tối đa 1.000 mẫu.

**Kết quả mong đợi:** Kết quả chỉ chứa dữ liệu thuộc đúng Server/Node, phạm vi và khoảng thời gian đã chọn; khi không có dữ liệu, giao diện hiển thị `No data`.

### MET-07. Hỗ trợ phát hiện mất telemetry

**Tham chiếu:** BR-08, NFR-01, `06-alert-requirements.md`.

Backend phải lưu thời điểm nhận mẫu gần nhất để module cảnh báo có thể phát hiện trường hợp Server không gửi telemetry quá 90 giây. Việc chuyển trạng thái Node sang `OFFLINE` và tạo cảnh báo `NODE_OFFLINE` thuộc phạm vi của tài liệu 06, không lặp lại xử lý cảnh báo trong module Metrics.

**Kết quả mong đợi:** Module cảnh báo có đủ thông tin thời điểm để đánh giá thời gian kể từ mẫu cuối; quy tắc trạng thái và cảnh báo được kiểm thử theo `06-alert-requirements.md`.

### MET-08. Gửi lại dữ liệu khi kết nối được khôi phục

**Tham chiếu:** FR-M4, NFR-04.

Collector Agent phải tiếp tục gửi dữ liệu sau khi kết nối được khôi phục. Theo NFR-04, Agent lưu đệm tối đa 720 mẫu (xấp xỉ một giờ ở chu kỳ 5 giây), gửi bù từ cũ đến mới với tối đa 20 mẫu mỗi chu kỳ; khi bộ đệm đầy, mẫu cũ nhất bị loại bỏ.

**Kết quả mong đợi:** Sau khi kết nối được khôi phục, Agent tiếp tục gửi dữ liệu được lưu đệm theo thứ tự quy định. Việc kiểm thử cần đối chiếu số mẫu Agent đã tạo với số bản ghi Backend đã lưu.

## 6. Quy tắc và tiêu chí kiểm thử

| Mã kiểm thử | Kịch bản | Kết quả mong đợi |
| --- | --- | --- |
| TC-MET-01 | Chạy Agent theo chu kỳ mặc định | Mẫu telemetry được gửi xấp xỉ mỗi 5 giây. |
| TC-MET-02 | Gửi mẫu với `serverCode` đã đăng ký | Backend liên kết và lưu dữ liệu cho đúng Server/Node. |
| TC-MET-03 | Gửi mẫu với payload sai hoặc `serverCode` không tồn tại | Backend từ chối yêu cầu và trả lỗi phù hợp. |
| TC-MET-04 | Truy vấn lịch sử sau khi lưu mẫu | Có thể tìm lại mẫu theo Server/Node và thời điểm. |
| TC-MET-05 | Dashboard đang mở khi có mẫu mới | Giao diện nhận dữ liệu qua <http://Socket.IO>  và hiển thị đúng thiết bị. |
| TC-MET-06 | Truy vấn một khoảng thời gian không có dữ liệu | Giao diện hiển thị `No data`. |
| TC-MET-07 | Không có mẫu mới trong hơn 90 giây | Module cảnh báo phát hiện `OFFLINE` theo tiêu chí ở tài liệu 06. |
| TC-MET-08 | Ngắt kết nối rồi khôi phục kết nối Agent | Agent gửi lại dữ liệu được đệm; nhóm đối chiếu số mẫu bị thiếu hoặc trùng. |

## 7. Tài liệu liên quan

-  <https://tranhoangphuc41207.atlassian.net/wiki/x/BICN> – Tổng quan, API và thuật ngữ dự án.
- `02-auth-requirements.md` – Xác thực người dùng và Agent.
- `04-server-requirements.md` – Danh mục Server/Node và thông tin thiết bị.
- `06-alert-requirements.md` – Ngưỡng, phát hiện bất thường và vòng đời cảnh báo.
- `07-audit-logs-requirements.md` – Phạm vi và quy tắc audit log.
- `08-non-functional-requirements.md` – Hiệu năng, độ tin cậy, bảo mật và hiện trạng triển khai.

**Tham chiếu SRS:** FR-M1, FR-M4, FR-O3; UC-07, UC-15; BR-07, BR-08, BR-16; NFR-01, NFR-03, NFR-04.

