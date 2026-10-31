# 07\-audit\-logs\-requirements\.md

# 1. Giới thiệu

## 1.1. Mục đích

Tài liệu mô tả các yêu cầu của module Audit Logs: tự động ghi lại ai đã làm gì, lên đối tượng nào, vào lúc nào trong hệ thống, và cho phép quản trị viên tra cứu nhật ký để truy vết và kiểm tra tuân thủ.

Tài liệu làm cơ sở thống nhất giữa các thành viên khi thiết kế, lập trình, kiểm thử và tích hợp với Web Admin.

## 1.2. Phạm vi

Thuộc phạm vi của tài liệu này:

- Ghi nhật ký đăng nhập thành công và thất bại.

- Tự động ghi nhật ký mọi thao tác thêm, sửa, xóa thành công.

- Quy ước đặt tên hành động và đối tượng, che dữ liệu nhạy cảm.

- Tra cứu nhật ký có lọc và phân trang (chỉ ADMIN).

- Đảm bảo nhật ký là dữ liệu chỉ đọc qua API.

Không thuộc phạm vi (được mô tả ở tài liệu khác): đăng nhập và cấp token (02), người dùng (03), máy chủ (04), số liệu giám sát (05), cảnh báo (06), yêu cầu phi chức năng tổng hợp (08).

## 1.3. Tài liệu tham chiếu

- Đề bài dự án AR-IMMS (Project Công nghệ phần mềm): yêu cầu ghi nhật ký cấu hình, phiếu bảo trì, hành động từ xa và báo cáo nhật ký.

- Mã nguồn Backend NestJS, nhánh KAN-71: src/audit-logs (controller, service, entity, interceptor), src/auth/auth.service.ts.

- Tệp database.sql: bảng audit\_logs.

## 1.4. Thuật ngữ

|  |  |
| --- | --- |
| **Thuật ngữ** | **Giải thích** |
| Audit log (nhật ký hoạt động) | Bản ghi không thể bị người dùng sửa, cho biết một hành động đã xảy ra. |
| Action | Tên hành động, ví dụ CREATE\_SERVER, LOGIN. |
| Entity | Đối tượng bị tác động, gồm loại (entity\_type) và mã (entity\_id). |
| Interceptor | Thành phần của NestJS chạy trước và sau mỗi yêu cầu, dùng để ghi nhật ký tự động. |
| RBAC | Phân quyền theo vai trò: ADMIN, OPERATOR, TECHNICIAN. |

# 2. Tổng quan module

## 2.1. Vai trò trong hệ thống

Module Audit Logs là nơi lưu vết hoạt động của toàn hệ thống. Có hai nguồn ghi: (1) bộ chặn yêu cầu AuditInterceptor, áp dụng cho toàn bộ ứng dụng, tự ghi mọi thao tác thêm, sửa, xóa thành công; (2) AuthService ghi riêng các sự kiện đăng nhập.

Quản trị viên xem nhật ký qua một API chỉ đọc để truy vết thay đổi cấu hình và hoạt động của người dùng, đáp ứng yêu cầu xem nhật ký và lịch sử thay đổi cấu hình trong đề bài.

## 2.2. Tác nhân và quyền

|  |  |  |
| --- | --- | --- |
| **Tác nhân** | **Mô tả** | **Quyền với module Audit Logs** |
| ADMIN | Quản trị viên. | Xem nhật ký (có lọc, phân trang). |
| OPERATOR | Nhân viên vận hành. | Không xem được nhật ký. Thao tác của họ vẫn được ghi. |
| TECHNICIAN | Kỹ thuật viên hiện trường. | Không xem được nhật ký. Thao tác của họ vẫn được ghi. |
| Hệ thống | Bộ chặn yêu cầu và dịch vụ đăng nhập. | Tự động ghi nhật ký. |

## 2.3. Quan hệ với các module khác

|  |  |
| --- | --- |
| **Module** | **Quan hệ với Audit Logs** |
| auth (02) | Gọi dịch vụ ghi nhật ký cho đăng nhập thành công (LOGIN) và thất bại (LOGIN\_FAILED). |
| users (03) | Mọi thao tác thêm, sửa, xóa người dùng được ghi với entity\_type USER. Cột user\_id tham chiếu bảng users. |
| servers (04) | Thao tác thêm, sửa, đổi ngưỡng, đổi trạng thái, xóa máy chủ được ghi với entity\_type SERVER. |
| alerts (06) | Thao tác xác nhận và đóng cảnh báo được ghi với entity\_type ALERT. |
| metrics (05) | Bị loại khỏi nhật ký tự động vì tần suất rất cao. |

# 3. Yêu cầu chức năng

Tóm tắt các yêu cầu chức năng:

|  |  |  |  |
| --- | --- | --- | --- |
| **Mã** | **Tên yêu cầu** | **API / Cách kích hoạt** | **Quyền** |
| FR-AUD-01 | Ghi nhật ký đăng nhập thành công | Tự động khi đăng nhập | Hệ thống |
| FR-AUD-02 | Ghi nhật ký đăng nhập thất bại | Tự động khi đăng nhập lỗi | Hệ thống |
| FR-AUD-03 | Tự động ghi nhật ký thao tác thêm, sửa, xóa | Tự động (bộ chặn yêu cầu) | Hệ thống |
| FR-AUD-04 | Quy ước đặt tên hành động và đối tượng | Tự động | Hệ thống |
| FR-AUD-05 | Che dữ liệu nhạy cảm | Tự động | Hệ thống |
| FR-AUD-06 | Ghi nhật ký không làm hỏng yêu cầu chính | Tự động | Hệ thống |
| FR-AUD-07 | Tra cứu nhật ký | GET /audit-logs | ADMIN |
| FR-AUD-08 | Nhật ký chỉ đọc | Không có API sửa, xóa | - |

 

### FR-AUD-01. Ghi nhật ký đăng nhập thành công

|  |  |
| --- | --- |
| **Kích hoạt** | POST /auth/login với email và mật khẩu đúng, tài khoản đang hoạt động. |
| **Xử lý** | Trước khi trả token, ghi một bản ghi nhật ký. |
| **Nội dung** | action: LOGIN.user\_id: id người dùng.entity\_type: USER, entity\_id: id người dùng.details: { email }. |

 

### FR-AUD-02. Ghi nhật ký đăng nhập thất bại

|  |  |
| --- | --- |
| **Kích hoạt** | POST /auth/login sai email hoặc mật khẩu, hoặc tài khoản bị vô hiệu hóa. |
| **Xử lý** | Ghi nhật ký rồi trả lỗi 401. |
| **Nội dung** | action: LOGIN\_FAILED.Sai email hoặc mật khẩu: user\_id rỗng nếu email không tồn tại; có giá trị nếu email đúng nhưng mật khẩu sai. details: { email, reason: "Sai email hoặc mật khẩu" }.Tài khoản bị vô hiệu hóa: user\_id là id tài khoản. details: { email, reason: "Tài khoản bị vô hiệu hóa" }. |
| **Mục đích** | Phát hiện dò mật khẩu và truy cập trái phép. |
| **Ghi chú** | Mật khẩu người dùng nhập không bao giờ được ghi vào nhật ký. |

 

### FR-AUD-03. Tự động ghi nhật ký thao tác thêm, sửa, xóa

|  |  |
| --- | --- |
| **Phạm vi** | Mọi yêu cầu dùng phương thức POST, PUT, PATCH, DELETE của toàn bộ API. |
| **Điều kiện ghi** | Chỉ ghi khi yêu cầu xử lý thành công (không lỗi). |
| **Loại trừ** | Đường dẫn bắt đầu bằng /auth (đăng nhập được ghi riêng ở FR-AUD-01, 02).Đường dẫn bắt đầu bằng /metrics (Agent gửi số liệu tần suất cao).Các yêu cầu GET (chỉ xem, không thay đổi dữ liệu). |
| **Nội dung mỗi bản ghi** | user\_id: người dùng đang đăng nhập (từ token).action, entity\_type, entity\_id theo FR-AUD-04.details: chuỗi JSON gồm method, path (đường dẫn đầy đủ kèm tham số) và body của yêu cầu (đã che theo FR-AUD-05). |
| **Liên hệ đề bài** | Đáp ứng yêu cầu ghi nhật ký mọi thay đổi cấu hình, cập nhật phiếu bảo trì và các thao tác thay đổi dữ liệu. |

 

### FR-AUD-04. Quy ước đặt tên hành động và đối tượng

|  |  |
| --- | --- |
| **Hành động (action)** | Có dạng ĐỘNGTỪ\_ĐỐITƯỢNG, thêm phần phụ nếu đường dẫn có đoạn con không phải số. Động từ lấy theo phương thức: POST là CREATE, PUT và PATCH là UPDATE, DELETE là DELETE. |
| **Ví dụ** | POST /servers: CREATE\_SERVER.PATCH /servers/1/thresholds: UPDATE\_SERVER\_THRESHOLDS.PATCH /alerts/5/acknowledge: UPDATE\_ALERT\_ACKNOWLEDGE.DELETE /users/3: DELETE\_USER. |
| **Loại đối tượng (entity\_type)** | Lấy từ đoạn đầu của đường dẫn: servers là SERVER, users là USER, alerts là ALERT, tickets là TICKET, maintenance-logs là MAINTENANCE\_LOG. Đường dẫn khác được viết hoa và dùng nguyên tên. |
| **Mã đối tượng (entity\_id)** | Lấy từ tham số id trên đường dẫn; nếu không có thì lấy id trong kết quả trả về (ví dụ khi tạo mới). Rỗng nếu không phải số nguyên. |

 

### FR-AUD-05. Che dữ liệu nhạy cảm

|  |  |
| --- | --- |
| **Xử lý** | Trước khi ghi, loại bỏ khỏi body các khóa password, passwordHash, password\_hash. |
| **Phạm vi** | Chỉ loại bỏ các khóa ở cấp ngoài cùng của body (xem mục 8). |

 

### FR-AUD-06. Ghi nhật ký không làm hỏng yêu cầu chính

|  |  |
| --- | --- |
| **Xử lý** | Ghi nhật ký chạy không chờ kết quả (không await), nên không làm chậm phản hồi.Nếu ghi nhật ký lỗi, hệ thống chỉ báo lỗi vào console và vẫn trả kết quả bình thường cho người dùng. |
| **Đánh đổi** | Có thể mất một bản ghi nhật ký khi cơ sở dữ liệu lỗi, nhưng thao tác nghiệp vụ không bị ảnh hưởng. |

 

### FR-AUD-07. Tra cứu nhật ký

|  |  |
| --- | --- |
| **Tác nhân** | ADMIN. |
| **API** | GET /audit-logs |
| **Tham số** | userId: số nguyên, lọc theo người thực hiện.entityType: lọc theo loại đối tượng (không phân biệt hoa thường), ví dụ server.action: lọc theo hành động (không phân biệt hoa thường), ví dụ delete\_server.page: mặc định 1. limit: mặc định 50, tối thiểu 1, tối đa 200. |
| **Xử lý** | Lọc theo các tham số có truyền, sắp xếp mới nhất trước (id giảm dần), phân trang. |
| **Kết quả** | 200: { data, total, page, limit }.400: userId không phải số, hoặc page, limit không phải số nguyên.401: thiếu hoặc sai token.403: vai trò không phải ADMIN. |
| **Ghi chú** | Mã bản ghi (id) là số lớn, API trả về dạng chuỗi. |

 

### FR-AUD-08. Nhật ký chỉ đọc

|  |  |
| --- | --- |
| **Xử lý** | Module chỉ cung cấp API GET. Không có API sửa hoặc xóa bản ghi nhật ký. |
| **Ghi chú** | Chưa có biện pháp bảo vệ ở mức cơ sở dữ liệu (xem mục 8). |

 

# 4. Mô hình dữ liệu

Bảng audit\_logs (PostgreSQL). Khi gọi API, tên trường viết theo dạng camelCase, ví dụ entity\_type là entityType.

|  |  |  |
| --- | --- | --- |
| **Cột** | **Kiểu và ràng buộc** | **Ý nghĩa** |
| id | BIGSERIAL, khóa chính | Mã bản ghi (số lớn). |
| user\_id | INT, khóa ngoại users(id), có thể rỗng | Người thực hiện. Rỗng khi đăng nhập sai email không tồn tại. |
| action | VARCHAR(100), bắt buộc | Tên hành động. |
| entity\_type | VARCHAR(50), có thể rỗng | Loại đối tượng bị tác động. |
| entity\_id | INT, có thể rỗng | Mã đối tượng bị tác động. |
| details | TEXT, có thể rỗng | Chi tiết dạng chuỗi JSON. |
| created\_at | TIMESTAMP, mặc định thời điểm ghi | Thời điểm xảy ra hành động. |

## 4.1. Các hành động thường gặp

|  |  |  |
| --- | --- | --- |
| **Action** | **Entity type** | **Khi nào** |
| LOGIN | USER | Đăng nhập thành công. |
| LOGIN\_FAILED | USER | Đăng nhập thất bại. |
| CREATE\_SERVER | SERVER | Đăng ký máy chủ mới. |
| UPDATE\_SERVER | SERVER | Cập nhật thông tin máy chủ. |
| UPDATE\_SERVER\_THRESHOLDS | SERVER | Đổi ngưỡng cảnh báo. |
| UPDATE\_SERVER\_STATUS | SERVER | Đổi trạng thái máy chủ. |
| DELETE\_SERVER | SERVER | Xóa máy chủ. |
| CREATE\_USER, UPDATE\_USER, DELETE\_USER | USER | Quản lý người dùng. |
| UPDATE\_ALERT\_ACKNOWLEDGE | ALERT | Xác nhận cảnh báo. |
| UPDATE\_ALERT\_RESOLVE | ALERT | Đóng cảnh báo thủ công. |

# 5. Phân quyền

API tra cứu yêu cầu JWT hợp lệ (thiếu hoặc sai token trả về 401) và vai trò ADMIN (sai vai trò trả về 403).

|  |  |  |  |
| --- | --- | --- | --- |
| **Chức năng** | **ADMIN** | **OPERATOR** | **TECHNICIAN** |
| Xem nhật ký (GET /audit-logs) | Có | Không | Không |
| Được ghi nhật ký khi thao tác | Có | Có | Có |

# 6. Yêu cầu phi chức năng

|  |  |  |
| --- | --- | --- |
| **Mã** | **Nhóm** | **Yêu cầu** |
| NFR-AUD-01 | Bảo mật | Chỉ ADMIN xem được nhật ký. Mật khẩu không bao giờ được ghi vào nhật ký. |
| NFR-AUD-02 | Tính đầy đủ | Mọi thao tác thêm, sửa, xóa thành công đều có bản ghi, không cần từng module tự ghi. |
| NFR-AUD-03 | Hiệu năng | Ghi nhật ký không chặn phản hồi. Danh sách giới hạn tối đa 200 bản ghi mỗi trang. |
| NFR-AUD-04 | Độ tin cậy | Lỗi khi ghi nhật ký không làm thất bại thao tác chính. |
| NFR-AUD-05 | Toàn vẹn | API không cho sửa hoặc xóa nhật ký. Thời điểm ghi do cơ sở dữ liệu tự đặt. |
| NFR-AUD-06 | Khả năng mở rộng | Thêm module mới có thao tác thay đổi dữ liệu tự động được ghi nhật ký, chỉ cần (tùy chọn) khai báo tên đối tượng trong bảng ánh xạ. |
| NFR-AUD-07 | Kiểm toán | Đáp ứng yêu cầu của đề bài: kiểm toán mọi thay đổi cấu hình, cập nhật phiếu bảo trì và hành động từ xa. |

# 7. Quy tắc nghiệp vụ

|  |  |
| --- | --- |
| **Mã** | **Quy tắc** |
| BR-AUD-01 | Mọi thao tác POST, PUT, PATCH, DELETE thành công đều được ghi, trừ /auth và /metrics. |
| BR-AUD-02 | Đăng nhập được ghi cả khi thành công (LOGIN) và thất bại (LOGIN\_FAILED). |
| BR-AUD-03 | Thao tác thất bại (bị từ chối quyền, dữ liệu sai, xung đột) không được ghi vào nhật ký. |
| BR-AUD-04 | Thao tác xem (GET) không được ghi. |
| BR-AUD-05 | Mật khẩu và mã băm mật khẩu không được lưu trong nhật ký. |
| BR-AUD-06 | Bản ghi nhật ký không được sửa hoặc xóa qua API. |
| BR-AUD-07 | Chỉ ADMIN được xem nhật ký. |
| BR-AUD-08 | Cảnh báo tự đóng bởi hệ thống không phát sinh từ yêu cầu API nên không có bản ghi nhật ký. |

# 8. Khoảng trống so với đề bài và đề xuất

Khi đối chiếu mã nguồn hiện tại với đề bài, các điểm sau chưa được đáp ứng hoặc cần bổ sung:

|  |  |  |  |  |
| --- | --- | --- | --- | --- |
| **STT** | **Vấn đề** | **Yêu cầu của đề bài** | **Đề xuất** | **Ưu tiên** |
| 1 | Không lọc được theo khoảng thời gian, không tìm trong nội dung chi tiết. | Xem nhật ký và báo cáo kiểm toán. | Thêm tham số from, to (thời gian) và search trong details. | Cao |
| 2 | Chưa ghi giá trị trước và sau khi thay đổi; chỉ có nội dung yêu cầu gửi lên. | Lịch sử thay đổi cấu hình. | Ghi thêm giá trị cũ của các trường bị đổi để biết thay đổi thực tế. | Trung bình |
| 3 | Chỉ che các khóa mật khẩu ở cấp ngoài cùng; dữ liệu nhạy cảm lồng bên trong hoặc khóa khác (token, apiKey) chưa được che. | Bảo mật dữ liệu. | Che đệ quy và mở rộng danh sách khóa nhạy cảm. | Trung bình |
| 4 | Danh sách chỉ có user\_id, chưa kèm tên hoặc email người thực hiện. | Truy vết người thực hiện. | Trả thêm thông tin người dùng (join bảng users). | Trung bình |
| 5 | Chưa ghi địa chỉ IP và trình duyệt của người thực hiện. | Kiểm toán truy cập. | Thêm cột ip\_address, user\_agent. | Trung bình |
| 6 | Thao tác bị từ chối (403) hoặc thất bại không được ghi; truy cập trái quyền không để lại dấu vết. | Kiểm toán bảo mật. | Ghi thêm các lần từ chối quyền (ACCESS\_DENIED). | Trung bình |
| 7 | Chưa bảo vệ nhật ký ở mức cơ sở dữ liệu (vẫn có thể sửa, xóa bằng truy vấn trực tiếp) và chưa có chính sách lưu trữ. | Dữ liệu nhật ký tuân thủ (compliance). | Chỉ cấp quyền INSERT và SELECT cho tài khoản ứng dụng; đặt chính sách lưu trữ và dọn dẹp. | Trung bình |
| 8 | Chưa xuất được nhật ký ra tệp (CSV). | Báo cáo kiểm toán hệ thống. | Thêm API xuất CSV cho ADMIN. | Thấp |
| 9 | Thao tác từ xa trên phiên AR (ví dụ khởi động lại dịch vụ) chưa có API và chưa được ghi nhật ký. | Yêu cầu xác nhận và ghi nhật ký cho thao tác từ xa gây gián đoạn. | Khi bổ sung API thao tác từ xa, đảm bảo ghi nhật ký và yêu cầu xác nhận. | Thấp |

# 9. Tiêu chí chấp nhận và kịch bản kiểm thử

|  |  |  |
| --- | --- | --- |
| **Mã** | **Kịch bản** | **Kết quả mong đợi** |
| TC-01 | Đăng nhập đúng email và mật khẩu. | Có bản ghi action LOGIN, entity\_type USER, details chứa email. |
| TC-02 | Đăng nhập sai mật khẩu với email có tồn tại. | 401; có bản ghi LOGIN\_FAILED với user\_id của tài khoản, lý do "Sai email hoặc mật khẩu". |
| TC-03 | Đăng nhập với email không tồn tại. | 401; có bản ghi LOGIN\_FAILED với user\_id rỗng. |
| TC-04 | Đăng nhập tài khoản bị vô hiệu hóa. | 401; bản ghi LOGIN\_FAILED, lý do "Tài khoản bị vô hiệu hóa". |
| TC-05 | ADMIN tạo máy chủ (POST /servers). | Có bản ghi CREATE\_SERVER, entity\_type SERVER, entity\_id là id máy chủ mới. |
| TC-06 | ADMIN đổi ngưỡng máy chủ 1. | Có bản ghi UPDATE\_SERVER\_THRESHOLDS, entity\_id là 1, details chứa body. |
| TC-07 | Tạo người dùng kèm mật khẩu. | Bản ghi CREATE\_USER có details không chứa password hoặc passwordHash. |
| TC-08 | Gọi API bị từ chối (409 trùng mã, 403 sai quyền). | Không có bản ghi nhật ký cho yêu cầu thất bại. |
| TC-09 | Gọi GET /servers. | Không có bản ghi nhật ký. |
| TC-10 | Agent gửi POST /metrics. | Không có bản ghi nhật ký. |
| TC-11 | Gọi GET /audit-logs khi chưa đăng nhập; bằng OPERATOR; bằng ADMIN. | 401; 403; 200. |
| TC-12 | GET /audit-logs?entityType=server&action=delete\_server. | Chỉ các bản ghi DELETE\_SERVER của SERVER, mới nhất trước. |
| TC-13 | GET /audit-logs?userId=abc. | 400 "userId phải là số". |
| TC-14 | GET /audit-logs?limit=1000. | Chỉ trả tối đa 200 bản ghi mỗi trang. |
| TC-15 | Giả lập lỗi cơ sở dữ liệu khi ghi nhật ký rồi thực hiện một thao tác sửa máy chủ. | Thao tác sửa vẫn thành công; lỗi chỉ xuất hiện trong console. |
| TC-16 | Thử gọi PATCH hoặc DELETE /audit-logs/:id. | Không có API tương ứng (404). |
