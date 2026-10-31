# 06\-alert\-requirements\.md

# 1. Giới thiệu

## 1.1. Mục đích

Tài liệu mô tả các yêu cầu của module Alerts: tự động phát hiện sự cố từ số liệu giám sát (telemetry), tạo cảnh báo, chống tạo cảnh báo trùng, tự đóng cảnh báo khi sự cố hết, và cho phép người vận hành xem, xác nhận và đóng cảnh báo.

Tài liệu làm cơ sở thống nhất giữa các thành viên khi thiết kế, lập trình, kiểm thử và tích hợp với Web Admin, Collector Agent và ứng dụng di động AR.

## 1.2. Phạm vi

Thuộc phạm vi của tài liệu này:

- Đánh giá số liệu giám sát và phát hiện vượt ngưỡng CPU, RAM, container Docker không chạy.

- Tạo cảnh báo, phân mức nghiêm trọng, chống trùng lặp, tự đóng cảnh báo.

- Xem danh sách (có lọc, phân trang) và chi tiết cảnh báo.

- Xác nhận (acknowledge) và đóng (resolve) cảnh báo.

- Ghi nhật ký các thao tác trên cảnh báo.

Không thuộc phạm vi (được mô tả ở tài liệu khác): đăng nhập (02), người dùng (03), máy chủ và ngưỡng cấu hình (04), nhận và lưu số liệu (05), nhật ký hoạt động (07), yêu cầu phi chức năng tổng hợp (08).

## 1.3. Tài liệu tham chiếu

- Đề bài dự án AR-IMMS (Project Công nghệ phần mềm).

- Mã nguồn Backend NestJS, nhánh KAN-71: src/alerts (controller, service, entity), src/metrics (nơi gọi đánh giá cảnh báo).

- Tệp database.sql: bảng alerts, tickets và chỉ mục idx\_alerts\_server\_status.

## 1.4. Thuật ngữ

|  |  |
| --- | --- |
| **Thuật ngữ** | **Giải thích** |
| Cảnh báo (Alert) | Bản ghi cho biết một máy chủ đang gặp sự cố cần chú ý. |
| Telemetry | Số liệu giám sát do Collector Agent gửi định kỳ về Backend. |
| Ngưỡng | Mức sử dụng CPU hoặc RAM (%) cấu hình riêng cho từng máy chủ. |
| Acknowledge | Xác nhận đã tiếp nhận cảnh báo, đang xử lý. |
| Resolve | Đóng cảnh báo, sự cố đã được giải quyết. |
| Cảnh báo đang hoạt động | Cảnh báo ở trạng thái OPEN hoặc ACKNOWLEDGED. |

# 2. Tổng quan module

## 2.1. Vai trò trong hệ thống

Mỗi lần Collector Agent gửi số liệu (POST /metrics), module Metrics tìm máy chủ theo serverCode rồi gọi hàm đánh giá của module Alerts. Hàm này so sánh số liệu với ngưỡng của máy chủ, tạo hoặc đóng cảnh báo, và trả về danh sách loại cảnh báo đang vi phạm để Metrics đưa vào phản hồi cho Agent.

Người vận hành dùng các API của module để theo dõi và xử lý cảnh báo. Phiếu bảo trì (tickets) có thể tham chiếu đến một cảnh báo qua cột alert\_id.

## 2.2. Tác nhân và quyền

|  |  |  |
| --- | --- | --- |
| **Tác nhân** | **Mô tả** | **Quyền với module Alerts** |
| ADMIN | Quản trị viên. | Xem, xác nhận, đóng cảnh báo. |
| OPERATOR | Nhân viên vận hành. | Xem, xác nhận, đóng cảnh báo. |
| TECHNICIAN | Kỹ thuật viên hiện trường. | Chỉ xem. |
| Hệ thống (Metrics) | Gọi đánh giá khi nhận số liệu. | Tự động tạo và tự động đóng cảnh báo. |

## 2.3. Quan hệ với các module khác

|  |  |
| --- | --- |
| **Module** | **Quan hệ với Alerts** |
| metrics (05) | Gọi AlertsService.evaluate mỗi lần nhận số liệu và đưa kết quả vào phản hồi. |
| servers (04) | Cung cấp ngưỡng cpuThreshold, ramThreshold. Cảnh báo tham chiếu server\_id. |
| users (03) | Lưu người xác nhận cảnh báo (acknowledged\_by). |
| audit-logs (07) | Tự ghi nhật ký thao tác xác nhận và đóng cảnh báo. |
| tickets | Phiếu bảo trì có thể gắn với cảnh báo qua alert\_id. |

# 3. Yêu cầu chức năng

Tóm tắt các yêu cầu chức năng:

|  |  |  |  |
| --- | --- | --- | --- |
| **Mã** | **Tên yêu cầu** | **API / Cách kích hoạt** | **Quyền** |
| FR-ALR-01 | Phát hiện vượt ngưỡng CPU và RAM | Tự động khi nhận số liệu | Hệ thống |
| FR-ALR-02 | Phát hiện container Docker không chạy | Tự động khi nhận số liệu | Hệ thống |
| FR-ALR-03 | Phân mức nghiêm trọng | Tự động | Hệ thống |
| FR-ALR-04 | Chống tạo cảnh báo trùng | Tự động | Hệ thống |
| FR-ALR-05 | Tự đóng cảnh báo khi trở lại bình thường | Tự động | Hệ thống |
| FR-ALR-06 | Xem danh sách cảnh báo | GET /alerts | Mọi vai trò |
| FR-ALR-07 | Xem chi tiết cảnh báo | GET /alerts/:id | Mọi vai trò |
| FR-ALR-08 | Xác nhận cảnh báo | PATCH /alerts/:id/acknowledge | ADMIN, OPERATOR |
| FR-ALR-09 | Đóng cảnh báo thủ công | PATCH /alerts/:id/resolve | ADMIN, OPERATOR |
| FR-ALR-10 | Ghi nhật ký thao tác trên cảnh báo | Tự động (audit-logs) | Hệ thống |

 

### FR-ALR-01. Phát hiện vượt ngưỡng CPU và RAM

|  |  |
| --- | --- |
| **Kích hoạt** | Mỗi lần Backend nhận số liệu từ Collector Agent (POST /metrics). |
| **Đầu vào** | Máy chủ (đã tìm theo serverCode) với cpuThreshold và ramThreshold.Số liệu: cpuUsage, ramUsage (0 đến 100), networkIn, networkOut, danh sách container, thời điểm đo. |
| **Xử lý** | Loại HIGH\_CPU: vi phạm khi cpuUsage lớn hơn cpuThreshold.Loại HIGH\_RAM: vi phạm khi ramUsage lớn hơn ramThreshold.Dấu bằng không vi phạm: chỉ vượt hẳn ngưỡng mới tạo cảnh báo. |
| **Kết quả** | Tạo cảnh báo mới (trạng thái OPEN) nếu chưa có cảnh báo hoạt động cùng loại (xem FR-ALR-04). Trả về danh sách loại đang vi phạm, ví dụ \["HIGH\_CPU"\]. |
| **Nội dung cảnh báo** | Ví dụ: "CPU usage reached 92%, exceeding the 80% threshold". |

 

### FR-ALR-02. Phát hiện container Docker không chạy

|  |  |
| --- | --- |
| **Kích hoạt** | Mỗi lần nhận số liệu có kèm danh sách container. |
| **Xử lý** | Loại DOCKER\_DOWN: vi phạm khi có ít nhất một container có status khác "running" (ví dụ exited, paused). |
| **Kết quả** | Tạo cảnh báo mức WARNING, nội dung liệt kê tên các container không chạy, ví dụ "Docker container not running: redis, nginx". |
| **Ghi chú** | Nếu số liệu không có danh sách container thì coi như không vi phạm. |

 

### FR-ALR-03. Phân mức nghiêm trọng

|  |  |
| --- | --- |
| **Xử lý** | HIGH\_CPU: CRITICAL khi cpuUsage từ 95% trở lên, ngược lại WARNING.HIGH\_RAM: CRITICAL khi ramUsage từ 95% trở lên, ngược lại WARNING.DOCKER\_DOWN: luôn WARNING. |
| **Ghi chú** | Mốc 95% đang cố định trong mã nguồn, chưa cấu hình được. |

 

### FR-ALR-04. Chống tạo cảnh báo trùng

|  |  |
| --- | --- |
| **Mô tả** | Một máy chủ chỉ có tối đa một cảnh báo hoạt động cho mỗi loại cảnh báo tại một thời điểm. |
| **Xử lý** | Khi phát hiện vi phạm, hệ thống tìm cảnh báo cùng máy chủ, cùng loại, đang ở trạng thái OPEN hoặc ACKNOWLEDGED. Nếu đã có thì không tạo mới. Nếu chưa có thì tạo mới. |
| **Kết quả** | Dù Agent gửi số liệu vượt ngưỡng liên tục mỗi 5 giây, chỉ có một cảnh báo được tạo cho đến khi cảnh báo đó được đóng. |
| **Liên hệ đề bài** | Đáp ứng yêu cầu hạn chế cảnh báo trùng lặp. |

 

### FR-ALR-05. Tự đóng cảnh báo khi trở lại bình thường

|  |  |
| --- | --- |
| **Xử lý** | Khi một loại cảnh báo không còn vi phạm trong lần nhận số liệu hiện tại và đang có cảnh báo hoạt động cùng loại, hệ thống chuyển cảnh báo đó sang RESOLVED. |
| **Áp dụng cho** | Cả cảnh báo OPEN và ACKNOWLEDGED. |
| **Ghi chú** | Việc tự đóng không lưu thời điểm đóng và không phân biệt với đóng thủ công (xem mục 8). Việc tự đóng không đi qua API nên không tạo bản ghi nhật ký hoạt động. |

 

### FR-ALR-06. Xem danh sách cảnh báo

|  |  |
| --- | --- |
| **Tác nhân** | Mọi người dùng đã đăng nhập. |
| **API** | GET /alerts |
| **Tham số** | status: OPEN, ACKNOWLEDGED hoặc RESOLVED (không phân biệt hoa thường).severity: WARNING hoặc CRITICAL (không phân biệt hoa thường).serverId: số nguyên, lọc theo máy chủ.page: mặc định 1. limit: mặc định 50, tối thiểu 1, tối đa 200. |
| **Xử lý** | Lọc theo các tham số có truyền, sắp xếp mới nhất trước (id giảm dần), phân trang. |
| **Kết quả** | 200: { data, total, page, limit } với total là tổng số bản ghi khớp bộ lọc.400: serverId không phải số, hoặc page, limit không phải số nguyên.401: thiếu hoặc sai token. |

 

### FR-ALR-07. Xem chi tiết cảnh báo

|  |  |
| --- | --- |
| **API** | GET /alerts/:id |
| **Tác nhân** | Mọi người dùng đã đăng nhập. |
| **Kết quả** | 200: thông tin cảnh báo.404: "Không tìm thấy cảnh báo".400: id không phải số nguyên. |

 

### FR-ALR-08. Xác nhận cảnh báo

|  |  |
| --- | --- |
| **Tác nhân** | ADMIN, OPERATOR. |
| **API** | PATCH /alerts/:id/acknowledge |
| **Điều kiện** | Cảnh báo phải đang ở trạng thái OPEN. |
| **Xử lý** | Chuyển trạng thái sang ACKNOWLEDGED, lưu người xác nhận (acknowledgedBy là id người dùng đang đăng nhập) và thời điểm xác nhận (acknowledgedAt). |
| **Kết quả** | 200: cảnh báo sau khi cập nhật.403: vai trò TECHNICIAN.404: không tìm thấy cảnh báo.409: "Chỉ xác nhận được cảnh báo đang ở trạng thái OPEN". |

 

### FR-ALR-09. Đóng cảnh báo thủ công

|  |  |
| --- | --- |
| **Tác nhân** | ADMIN, OPERATOR. |
| **API** | PATCH /alerts/:id/resolve |
| **Điều kiện** | Cảnh báo chưa ở trạng thái RESOLVED (đóng được từ OPEN hoặc ACKNOWLEDGED). |
| **Xử lý** | Chuyển trạng thái sang RESOLVED. |
| **Kết quả** | 200: cảnh báo sau khi cập nhật.403: vai trò TECHNICIAN.404: không tìm thấy cảnh báo.409: "Cảnh báo đã được đóng trước đó". |
| **Ghi chú** | Nếu sự cố vẫn còn khi đóng thủ công, lần nhận số liệu kế tiếp sẽ tạo cảnh báo mới (vì không còn cảnh báo hoạt động cùng loại). |

 

### FR-ALR-10. Ghi nhật ký thao tác trên cảnh báo

|  |  |
| --- | --- |
| **Xử lý** | Mỗi lần xác nhận hoặc đóng cảnh báo thành công, hệ thống tự ghi một bản ghi vào nhật ký hoạt động (module 07). |
| **Nội dung** | action là UPDATE\_ALERT\_ACKNOWLEDGE hoặc UPDATE\_ALERT\_RESOLVE; entity\_type là ALERT; entity\_id là id cảnh báo; kèm người thực hiện. |

 

# 4. Mô hình dữ liệu

Bảng alerts (PostgreSQL). Khi gọi API, tên trường viết theo dạng camelCase, ví dụ alert\_type là alertType.

|  |  |  |
| --- | --- | --- |
| **Cột** | **Kiểu và ràng buộc** | **Ý nghĩa** |
| id | SERIAL, khóa chính | Mã cảnh báo. |
| server\_id | INT, bắt buộc, khóa ngoại servers(id) | Máy chủ phát sinh cảnh báo. |
| alert\_type | VARCHAR(50), bắt buộc | Loại cảnh báo: HIGH\_CPU, HIGH\_RAM, DOCKER\_DOWN. |
| message | TEXT, bắt buộc | Nội dung mô tả cảnh báo. |
| severity | VARCHAR(20), mặc định WARNING | Mức nghiêm trọng: WARNING hoặc CRITICAL. |
| status | VARCHAR(20), mặc định OPEN | Trạng thái: OPEN, ACKNOWLEDGED, RESOLVED. |
| created\_at | TIMESTAMP, mặc định thời điểm tạo | Thời điểm phát sinh cảnh báo. |
| acknowledged\_by | INT, khóa ngoại users(id), có thể rỗng | Người xác nhận. |
| acknowledged\_at | TIMESTAMP, có thể rỗng | Thời điểm xác nhận. |

Chỉ mục idx\_alerts\_server\_status trên (server\_id, status) giúp tìm nhanh cảnh báo đang hoạt động của một máy chủ.

## 4.1. Các loại cảnh báo

|  |  |  |
| --- | --- | --- |
| **Loại** | **Điều kiện vi phạm** | **Mức nghiêm trọng** |
| HIGH\_CPU | cpuUsage \> cpuThreshold của máy chủ | CRITICAL nếu cpuUsage từ 95% trở lên, ngược lại WARNING |
| HIGH\_RAM | ramUsage \> ramThreshold của máy chủ | CRITICAL nếu ramUsage từ 95% trở lên, ngược lại WARNING |
| DOCKER\_DOWN | Có container có status khác running | WARNING |

## 4.2. Vòng đời trạng thái

|  |  |  |
| --- | --- | --- |
| **Từ trạng thái** | **Sang trạng thái** | **Cách thực hiện** |
| (mới) | OPEN | Hệ thống tạo khi phát hiện vi phạm và chưa có cảnh báo hoạt động cùng loại. |
| OPEN | ACKNOWLEDGED | ADMIN hoặc OPERATOR gọi acknowledge. |
| OPEN hoặc ACKNOWLEDGED | RESOLVED | ADMIN hoặc OPERATOR gọi resolve, hoặc hệ thống tự đóng khi số liệu trở lại bình thường. |
| RESOLVED | (không đổi) | Trạng thái cuối. Sự cố tái diễn sẽ tạo cảnh báo mới. |

# 5. Phân quyền

Mọi API đều yêu cầu JWT hợp lệ (thiếu hoặc sai token trả về 401). Sai vai trò trả về 403.

|  |  |  |  |
| --- | --- | --- | --- |
| **API** | **ADMIN** | **OPERATOR** | **TECHNICIAN** |
| GET /alerts | Có | Có | Có |
| GET /alerts/:id | Có | Có | Có |
| PATCH /alerts/:id/acknowledge | Có | Có | Không |
| PATCH /alerts/:id/resolve | Có | Có | Không |

# 6. Yêu cầu phi chức năng

|  |  |  |
| --- | --- | --- |
| **Mã** | **Nhóm** | **Yêu cầu** |
| NFR-ALR-01 | Bảo mật | Mọi API yêu cầu JWT dạng Bearer và kiểm tra vai trò theo mục 5. |
| NFR-ALR-02 | Độ tin cậy | Việc tạo và đóng cảnh báo diễn ra trong cùng lần xử lý số liệu, không phụ thuộc người dùng thao tác. |
| NFR-ALR-03 | Hiệu năng | Với mỗi máy chủ, mỗi lần nhận số liệu thực hiện 3 truy vấn kiểm tra cảnh báo hoạt động, được hỗ trợ bởi chỉ mục (server\_id, status). Phù hợp quy mô thử nghiệm; cần theo dõi khi số node và tần suất tăng. |
| NFR-ALR-04 | Phân trang | Danh sách cảnh báo giới hạn tối đa 200 bản ghi mỗi trang để tránh phản hồi quá lớn. |
| NFR-ALR-05 | Kiểm toán | Thao tác xác nhận và đóng cảnh báo được ghi vào nhật ký hoạt động (FR-ALR-10), phù hợp yêu cầu ghi nhật ký các hoạt động giám sát và cảnh báo của đề bài. |
| NFR-ALR-06 | Khả năng mở rộng | Thêm luật cảnh báo mới (ví dụ mạng, đĩa) chỉ cần thêm một phần tử vào danh sách luật trong hàm đánh giá, không đổi cấu trúc dữ liệu. |
| NFR-ALR-07 | Khả năng sử dụng | Thông báo lỗi nghiệp vụ bằng tiếng Việt. |

# 7. Quy tắc nghiệp vụ

|  |  |
| --- | --- |
| **Mã** | **Quy tắc** |
| BR-ALR-01 | Cảnh báo CPU và RAM chỉ phát sinh khi giá trị lớn hơn hẳn ngưỡng của máy chủ đó. |
| BR-ALR-02 | Mỗi máy chủ chỉ có tối đa một cảnh báo hoạt động (OPEN hoặc ACKNOWLEDGED) cho mỗi loại cảnh báo. |
| BR-ALR-03 | Mức CRITICAL áp dụng khi CPU hoặc RAM từ 95% trở lên; các trường hợp còn lại là WARNING. |
| BR-ALR-04 | Chỉ cảnh báo OPEN mới được xác nhận. |
| BR-ALR-05 | Cảnh báo RESOLVED không thể xác nhận hoặc đóng lại. |
| BR-ALR-06 | Cảnh báo tự đóng khi loại vi phạm đó biến mất trong lần nhận số liệu kế tiếp, bất kể đã được xác nhận hay chưa. |
| BR-ALR-07 | Chỉ ADMIN và OPERATOR được xác nhận và đóng cảnh báo. TECHNICIAN chỉ xem. |
| BR-ALR-08 | Cảnh báo không bị xóa; lịch sử được giữ lại ở trạng thái RESOLVED. |

# 8. Khoảng trống so với đề bài và đề xuất

Khi đối chiếu mã nguồn hiện tại với đề bài, các điểm sau chưa được đáp ứng hoặc cần bổ sung:

|  |  |  |  |  |
| --- | --- | --- | --- | --- |
| **STT** | **Vấn đề** | **Yêu cầu của đề bài** | **Đề xuất** | **Ưu tiên** |
| 1 | Chưa có cảnh báo mất kết nối. Không có tác vụ nào kiểm tra máy chủ không gửi số liệu. | Máy chủ bị coi là không khả dụng khi quá 90 giây không có telemetry; phát thông báo khi máy chủ hoặc Agent mất kết nối. | Thêm tác vụ định kỳ so sánh thời điểm nhận số liệu cuối với 90 giây, tạo cảnh báo loại SERVER\_OFFLINE và đặt máy chủ OFFLINE. | Cao |
| 2 | Chưa phát cảnh báo theo thời gian thực. Backend chưa có <http://Socket.IO> . | Truyền số liệu và cảnh báo thời gian thực qua WebSocket (<http://Socket.IO> ). | Phát sự kiện khi cảnh báo được tạo, xác nhận hoặc đóng (phối hợp Người 2). | Cao |
| 3 | Chưa có luật cho mạng (networkIn, networkOut) dù số liệu đã được gửi. | Phát hiện vượt ngưỡng tài nguyên. | Thêm luật HIGH\_NETWORK với ngưỡng cấu hình được. | Trung bình |
| 4 | Dễ nhấp nháy: chỉ số dao động quanh ngưỡng sẽ liên tục đóng rồi mở cảnh báo mới. | Hạn chế cảnh báo trùng lặp. | Thêm thời gian giữ hoặc ngưỡng đóng thấp hơn ngưỡng mở (ví dụ mở ở 80%, chỉ đóng khi xuống dưới 75%). | Trung bình |
| 5 | Không lưu thời điểm đóng và người đóng; không phân biệt tự đóng và đóng thủ công. | Ghi nhận hoạt động giám sát và cảnh báo để truy vết. | Thêm cột resolved\_at, resolved\_by (rỗng nếu tự đóng). | Trung bình |
| 6 | Mức CRITICAL (95%) và các luật đang cố định trong mã nguồn. | Cảnh báo và ngưỡng cấu hình được. | Đưa mức CRITICAL thành cấu hình theo máy chủ hoặc toàn hệ thống. | Trung bình |
| 7 | Chưa có liên kết trực tiếp từ cảnh báo sang phiếu bảo trì trong API cảnh báo. | Quản lý sự cố và phiếu bảo trì gắn với cảnh báo. | Trả về ticket liên quan trong chi tiết cảnh báo; cho phép tạo ticket từ cảnh báo. | Trung bình |
| 8 | Các giá trị status và severity không bị ràng buộc ở cơ sở dữ liệu (không có CHECK). | Toàn vẹn dữ liệu. | Thêm ràng buộc CHECK giống bảng tickets. | Thấp |
| 9 | Nội dung cảnh báo viết bằng tiếng Anh, trong khi thông báo lỗi và giao diện là tiếng Việt. | Sử dụng thống nhất. | Thống nhất ngôn ngữ hoặc lưu dữ liệu thô để giao diện tự dịch. | Thấp |
| 10 | Chưa có thông báo ra ngoài hệ thống (email, tin nhắn) cho cảnh báo CRITICAL. | Phát thông báo khi có sự cố. | Tích hợp kênh thông báo cho cảnh báo mức CRITICAL. | Thấp |

# 9. Tiêu chí chấp nhận và kịch bản kiểm thử

|  |  |  |
| --- | --- | --- |
| **Mã** | **Kịch bản** | **Kết quả mong đợi** |
| TC-01 | Gọi GET /alerts khi chưa đăng nhập. | 401. |
| TC-02 | TECHNICIAN gọi GET /alerts. | 200 với { data, total, page, limit }. |
| TC-03 | Gửi số liệu cpuUsage 92 cho máy chủ có ngưỡng CPU 80. | Có cảnh báo HIGH\_CPU, trạng thái OPEN, mức WARNING; phản hồi POST /metrics chứa \["HIGH\_CPU"\]. |
| TC-04 | Gửi số liệu cpuUsage 96. | Cảnh báo HIGH\_CPU mức CRITICAL (khi chưa có cảnh báo hoạt động cùng loại). |
| TC-05 | Gửi liên tiếp 10 lần số liệu cpuUsage 92. | Chỉ có một cảnh báo HIGH\_CPU hoạt động, không tạo trùng. |
| TC-06 | Sau TC-03, gửi số liệu cpuUsage 50. | Cảnh báo HIGH\_CPU tự chuyển RESOLVED. |
| TC-07 | Gửi số liệu có container redis ở trạng thái exited. | Có cảnh báo DOCKER\_DOWN, nội dung nêu tên redis. |
| TC-08 | Gửi số liệu cpuUsage đúng bằng ngưỡng (80 với ngưỡng 80). | Không tạo cảnh báo. |
| TC-09 | GET /alerts?status=open&severity=critical&serverId=1. | Chỉ các cảnh báo OPEN, CRITICAL của máy chủ 1; sắp xếp mới nhất trước. |
| TC-10 | GET /alerts?limit=1000. | Chỉ trả tối đa 200 bản ghi mỗi trang (limit trả về là 200). |
| TC-11 | GET /alerts?serverId=abc. | 400 "serverId phải là số". |
| TC-12 | GET /alerts/9999. | 404 "Không tìm thấy cảnh báo". |
| TC-13 | OPERATOR gọi acknowledge cảnh báo OPEN. | 200; trạng thái ACKNOWLEDGED; có acknowledgedBy và acknowledgedAt. |
| TC-14 | Gọi acknowledge lần hai trên cảnh báo đó. | 409 "Chỉ xác nhận được cảnh báo đang ở trạng thái OPEN". |
| TC-15 | TECHNICIAN gọi acknowledge hoặc resolve. | 403. |
| TC-16 | OPERATOR gọi resolve cảnh báo ACKNOWLEDGED; gọi resolve lần hai. | Lần đầu 200 (RESOLVED); lần hai 409 "Cảnh báo đã được đóng trước đó". |
| TC-17 | Sau khi đóng thủ công, sự cố vẫn còn và Agent gửi số liệu tiếp. | Tạo cảnh báo mới cùng loại. |
| TC-18 | Thực hiện acknowledge và resolve. | Có bản ghi nhật ký UPDATE\_ALERT\_ACKNOWLEDGE và UPDATE\_ALERT\_RESOLVE. |
