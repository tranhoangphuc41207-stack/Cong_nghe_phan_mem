# 01\-overview\.md

**I tổng quan dự án **

**1 thông tin dự án**

| **Thông tin ** | **Mô tả** |
| --- | --- |
| Tên dự án | Hệ thống Giám sát và Bảo trì Cơ sở Hạ tầng Tích hợp Thực tế Tăng cường |
| Số lượng thành viên | 5 thành viên |
| Giảng viên hướng dẫn | Nguyễn Văn Chiến |
| Đối tượng quản lý chính | Máy chủ/Node (Server/Node) |
| Mục đích chính | Hỗ trợ giám sát hạ tầng, xác định vị trí thiết bị, quản lý sự cố và theo dõi hoạt động bảo trì |
| Loại tài liệu | Đặc tả yêu cầu phần mềm (SRS) |

**1.1 Mục đích dự án **

-AR-IMMS được xây dựng nhằm hỗ trợ việc giám sát, quản lý và bảo trì cơ sở hạ tầng công nghệ thông tin thông qua sự kết hợp giữa hệ thống quản lý trên nền tảng Web và ứng dụng di động tích hợp thực tế tăng cường.

-Hệ thống Web cho phép người dùng có quyền truy cập quản lý thông tin hạ tầng, theo dõi tình trạng hoạt động của máy chủ, xem cảnh báo, tạo phiếu bảo trì, phân công công việc và theo dõi tiến độ xử lý sự cố.

-Ứng dụng AR trên thiết bị di động hỗ trợ kỹ thuật viên xác định thiết bị thông qua việc quét mã QR hoặc một loại dấu nhận diện hình ảnh được hệ thống hỗ trợ. Sau khi xác định thiết bị, ứng dụng có thể hiển thị các thông tin liên quan như mã thiết bị, vị trí, trạng thái hoạt động, chỉ số giám sát, cảnh báo và lịch sử bảo trì.

-Thông qua việc kết hợp các chức năng trên, AR-IMMS hướng đến các mục tiêu:

- Rút ngắn thời gian xác định thiết bị gặp sự cố.
- Hỗ trợ người dùng theo dõi tình trạng hoạt động của máy chủ.
- Nâng cao khả năng phối hợp giữa người vận hành và kỹ thuật viên.
- Chuẩn hóa quy trình tiếp nhận, phân công và xử lý sự cố.
- Lưu trữ lịch sử bảo trì để thuận tiện cho việc tra cứu.
- Tăng khả năng theo dõi và kiểm soát các hoạt động trong hệ thống.

Trong phạm vi ban đầu, hệ thống dự kiến được phát triển và trình diễn trong môi trường thử nghiệm hoặc mô phỏng phòng máy chủ. Việc tích hợp trực tiếp với hạ tầng đang vận hành thực tế chỉ được thực hiện khi có sự thống nhất và cho phép của nhóm dự án.

2 Bối cảnh cảnh và các vấn đề cần được giải quyết 

**1.2 Bảng mã hệ thống**

| **Mã** | **Tác dụng** |
| --- | --- |
| **200** | Xác nhận yêu cầu đã thực hiện thành công và có dữ liệu trả về (xem danh sách, xem chi tiết, sửa, xóa) |
| **201** | Xác nhận đã tạo mới thành công (đăng nhập, tạo tài khoản, thêm máy chủ, agent gửi số liệu) |
| **400** | Báo dữ liệu gửi lên sai hoặc thiếu (email sai định dạng, ngưỡng ngoài 0 đến 100) |
| **401** | Báo chưa đăng nhập, token sai hoặc hết hạn, sai mật khẩu, hoặc sai API key |
| **403** | Báo đã đăng nhập nhưng vai trò không đủ quyền làm việc này |
| **404** | Báo không tìm thấy thứ cần tìm (máy chủ, người dùng, cảnh báo không tồn tại) |
| **500** | Báo lỗi ở phía hệ thống (ví dụ mất kết nối cơ sở dữ liệu), người gọi không tự sửa được |

**1.3 Các module **

| **Module** | **Vai trò** | **Tài liệu chi tiết** |
| --- | --- | --- |
| auth, common | Đăng nhập, phân quyền | 02-auth-requirements.md |
| users | Quản lý tài khoản | 03-user-requirements.md |
| servers | Máy chủ, ngưỡng, phần cứng | 04-server-requirements.md |
| metrics | Nhận và lưu số liệu | 05-metrics-requirements.md |
| alerts | Cảnh báo | 06-alert-requirements.md |
| audit-logs | Nhật ký hoạt động | 07-audit-logs-requirements.md |
| (toàn hệ thống) | Phi chức năng | 08-non-functional-requirements.md |

**1.4 Thuật ngữ**

| **Thuật ngữ** | **Giải thích** |
| --- | --- |
| API | Giao diện để các phần mềm gọi lẫn nhau |
| JWT | Chuỗi token cấp sau khi đăng nhập, kèm theo mỗi lần gọi API |
| RBAC | Phân quyền theo vai trò |
| API key | Chuỗi bí mật để agent xác thực khi gửi số liệu |
| Agent | Chương trình thu thập số liệu trên máy chủ và gửi về Backend |
| Metric | Một lần đo: CPU, RAM, mạng, Docker |
| Ngưỡng (threshold) | Giá trị % mà vượt qua thì sinh cảnh báo |
| Cảnh báo (alert) | Bản ghi báo máy chủ có vấn đề, có vòng đời OPEN, ACKNOWLEDGED, RESOLVED |
| Audit Log | Nhật ký ghi lại ai làm gì, khi nào |
| Swagger | Trang tài liệu và thử API tại /api |
| CORS | Cơ chế cho phép trình duyệt gọi API ở địa chỉ khác |

**2 Tổng quan bối cảnh vấn đề và đề xuất giải pháp**

**2.1 Bối cảnh và vấn đề**

Hạ tầng máy chủ cần được theo dõi liên tục. Khi quản lý thủ công sẽ gặp các vấn đề:

- Thông tin máy chủ (vị trí, cấu hình, bảo hành) nằm rải rác, khó tra cứu.
- Sự cố như quá tải

**2.2 Giải pháp**

Backend AR-IMMS là dịch vụ API tập trung, thực hiện:

1. Lưu thông tin máy chủ, phần cứng và bảo hành.
2. Nhận số liệu giám sát (CPU, RAM, mạng, Docker) từ agent và lưu lịch sử.
3. Tự đối chiếu số liệu với ngưỡng của từng máy chủ để sinh cảnh báo.
4. Xác thực và phân quyền người dùng theo vai trò.
5. Ghi nhật ký mọi thao tác quan trọng để truy vết.

-  CPU/RAM hoặc dịch vụ ngừng được phát hiện muộn.
- Không rõ ai đã xử lý sự cố, xử lý khi nào.
- Khó kiểm soát ai được phép làm gì trên hệ thống.

**2.3 Mục tiêu nghiệp vụ**

| **Mục tiêu** | **Cách đo mức đạt** |
| --- | --- |
| Phát hiện sớm máy chủ quá tải hoặc dịch vụ ngừng | Cảnh báo được tạo ngay trong lần nhận số liệu vượt ngưỡng |
| Quản lý tập trung thông tin máy chủ, phần cứng, bảo hành | Tra cứu được toàn bộ máy chủ và danh sách máy sắp hết bảo hành |
| Mỗi vai trò chỉ làm đúng việc của mình | Truy cập sai quyền bị từ chối (lỗi 401/403) |
| Truy vết được ai làm gì, khi nào | Mọi thao tác thêm, sửa, xóa và đăng nhập có trong nhật ký |

**3 Phạm vi chức năng**

**3.1 Trong phạm vi **

| **Nhóm chức năng** | **Nội dung chính** |
| --- | --- |
| Xác thực và phân quyền | Đăng nhập JWT, phân quyền theo 3 vai trò, xác thực agent bằng API key |
| Quản lý tài khoản | Tạo, xem, khóa, mở khóa tài khoản |
| Quản lý máy chủ | Thêm, sửa, xóa, đổi trạng thái, cấu hình ngưỡng CPU/RAM |
| Phần cứng và bảo hành | Lưu thông tin thiết bị, danh sách máy sắp hết bảo hành |
| Giám sát | Nhận số liệu từ agent, lưu lịch sử, xem lịch sử |
| Cảnh báo | Sinh cảnh báo theo ngưỡng, xác nhận và đóng cảnh báo |
| Nhật ký hoạt động | Tự ghi thao tác, xem và lọc nhật ký |
| Tài liệu và tích hợp | Swagger, CORS, schema.sql, README |

**3.2 Chi tiết từng vai trò **

| **Vai trò** | **Mô tả** | **Được quyền** | **Không được quyền** |
| --- | --- | --- | --- |
| **ADMIN** | Quản trị hệ thống | Toàn quyền: tạo, xem, khóa, mở khóa tài khoản; thêm, sửa, xóa máy chủ; chỉnh ngưỡng; đổi trạng thái máy chủ; xem lịch sử số liệu; xem, xác nhận, đóng cảnh báo; xem nhật ký | Không có |
| **  OPERATOR** | Nhân viên vận hành | Xem máy chủ và danh sách sắp hết bảo hành; đổi trạng thái máy chủ; xem lịch sử số liệu; xem, xác nhận, đóng cảnh báo | Quản lý tài khoản; thêm, sửa, xóa máy chủ; chỉnh ngưỡng; xem nhật ký |
| **TECHNICIAN** | Kỹ thuật viên bảo trì | Xem máy chủ và danh sách sắp hết bảo hành; xem lịch sử số liệu; xem cảnh báo | Mọi thao tác thay đổi dữ liệu. Chức năng xử lý phiếu bảo trì chưa có API |
| **Agent giám sát** | Chương trình tự động trên máy chủ | Gửi số liệu qua POST /metrics bằng API key | Gọi bất kỳ API nào khác |

**3.3 Nhu cầu người dùng**

| **Vai trò** | **Sử dụng** | **Tác dụng** |
| --- | --- | --- |
| Người dùng | đăng nhập bằng email và mật khẩu | sử dụng hệ thống |
| ADMIN | tạo và khóa tài khoản | kiểm soát ai được vào hệ thống |
| ADMIN | thêm, sửa, xóa máy chủ và chỉnh ngưỡng | giữ danh mục chính xác |
| ADMIN | xem máy chủ sắp hết bảo hành | gia hạn hoặc thay thế kịp thời |
| ADMIN | xem nhật ký thao tác | điều tra khi có sự cố |
| Mọi vai trò | xem danh sách và chi tiết máy chủ | nắm tình trạng hạ tầng |
| OPERATOR | xem cảnh báo đang mở | biết máy nào cần xử lý |
| OPERATOR | xác nhận cảnh báo | báo cho người khác biết đang có người xử lý |
| Thành viên Frontend | có tài liệu API và mã lỗi rõ ràng | tích hợp nhanh |

**3.4 Danh mục các chức năng toàn hệ thống **

**a) Xác thực và phân quyền**

| **Chức năng nhỏ** | **Mô tả ** | **Quyền** |
| --- | --- | --- |
| Đăng nhập | Nhận email và mật khẩu, kiểm tra, trả token JWT cùng thông tin người dùng | Công khai |
| Xem thông tin đăng nhập | Trả id, email, role của người đang dùng token | Đã đăng nhập |
| Phân quyền theo vai trò | Mỗi API khai báo vai trò được phép; sai vai trò trả 403 |  |
| Xác thực agent | Đối chiếu header x-api-key với khóa cấu hình | Agent |

**b)Quản lý tài khoản**

| **Chức năng nhỏ** | **Mô tả ** | **Quyền** |
| --- | --- | --- |
| Tạo tài khoản | Nhận họ tên, email, mật khẩu (tối thiểu 6 ký tự), vai trò; băm mật khẩu bằng bcrypt; trùng email trả | ADMIN |
| Xem danh sách | Trả toàn bộ tài khoản theo thứ tự id, không kèm mật khẩu | ADMIN |
| Xem chi tiết | Trả một tài khoản theo id | ADMIN |
| Khóa tài khoản | Đặt is\_active = false; người đó không đăng nhập mới được | ADMIN |
| Mở khóa tài khoản | Đặt is\_active = true | ADMIN |

**c)Quản lý máy chủ**

| **Chức năng nhỏ** | **Mô tả ** | **Quyền** |
| --- | --- | --- |
| Xem danh sách | Trả toàn bộ máy chủ theo thứ tự id | Mọi vai trò |
| Xem chi tiết | Trả một máy chủ; không có thì 404 | Mọi vai trò |
| Thêm máy chủ | Bắt buộc serverCode, name; các trường khác tùy chọn; trùng mã thì 409 | ADMIN |
| Sửa thông tin | Cập nhật từng phần, trường không gửi thì giữ nguyên | ADMIN |
| Đổi trạng thái | Nhận một trong ONLINE, OFFLINE, WARNING, UNKNOWN | ADMIN, OPERATOR |
| Xóa máy chủ | Xóa nếu chưa có dữ liệu liên quan (lịch sử, cảnh báo, phiếu bảo trì), ngược lại 409 | ADMIN |

**d)Cấu hình ngưỡng cảnh báo**

| **Chức năng nhỏ** | **Mô tả ** | **Quyền** |
| --- | --- | --- |
| Xem ngưỡng | cpuThreshold, ramThreshold nằm trong thông tin máy chủ; mặc định 80 | Mọi vai trò |
| Đổi ngưỡng | Nhận hai số từ 0 đến 100; áp dụng cho lần nhận số liệu kế tiếp | ADMIN |

**e)Phần cứng và bảo hành**

| **Chức năng nhỏ** | **Mô tả ** | **Quyền** |
| --- | --- | --- |
| Lưu thông tin phần cứng | Hãng, model, số serial (duy nhất), CPU, RAM (GB), ổ đĩa (GB) | ADMIN |
| Lưu ngày mua và hạn bảo hành | Định dạng YYYY-MM-DD | ADMIN |
| Xem máy sắp hết bảo hành | Trả máy có hạn bảo hành đến hôm nay + days ngày (mặc định 30), gồm cả máy đã hết hạn, sắp xếp hạn tăng dần | Mọi vai trò |

**f)Giám sát chỉ số**

| **Chức năng nhỏ** | **Mô tả ** | **Quyền** |
| --- | --- | --- |
| Nhận số liệu | Agent gửi CPU, RAM, mạng, Docker theo serverCode | API key |
| Lưu lịch sử | Ghi mỗi lần nhận vào bảng history, kèm thông tin Docker dạng JSONB |  |
| Cập nhật trạng thái máy chủ | Có số liệu thì ONLINE, đang vi phạm ngưỡng thì WARNING |  |
| Xem lịch sử | Trả các lần đo mới nhất trước, mặc định 100, tối đa 1000 | Mọi vai trò |

**g)Cảnh Báo và nhật ký hoạt động**

| **Chức năng nhỏ** | **Mô tả ** | **Quyền** |
| --- | --- | --- |
| Cảnh báo RAM | HIGH\_RAM, quy tắc như CPU |  |
| Cảnh báo Docker | DOCKER\_DOWN khi có container không ở trạng thái running |  |
| Chống trùng | Đã có cảnh báo cùng loại, cùng máy đang hoạt động thì không tạo thêm |  |
| Tự đóng cảnh báo | Chỉ số về bình thường thì cảnh báo chuyển RESOLVED |  |
| Xem danh sách | Lọc theo trạng thái, mức độ, máy chủ; có phân trang | Mọi vai trò |
| Xem chi tiết | Một cảnh báo theo id | Mọi vai trò |
| Xác nhận cảnh báo | OPEN thành ACKNOWLEDGED, lưu người xác nhận và thời điểm | ADMIN, OPERATOR |
| Đóng cảnh báo | Chuyển RESOLVED thủ công | ADMIN, OPERATOR |
| Tự ghi thao tác thay đổi dữ liệu | Mọi POST, PUT, PATCH, DELETE thành công (trừ /auth, /metrics) |  |
| Ghi đăng nhập | LOGIN và LOGIN\_FAILED kèm email và lý do |  |
| Xem và lọc nhật ký | Lọc theo người, đối tượng, hành động; phân trang | ADMIN |

**h)Tài liệu API và tích hợp**

| **Chức năng nhỏ** | **Mô tả ** |
| --- | --- |
| Swagger | Trang /api liệt kê và thử API, có nút Authorize nhập token |
| CORS | Cho phép Frontend ở địa chỉ khác gọi API |
| Mã lỗi thống nhất | 400, 401, 403, 404, 409 dùng nhất quán |
| Khởi tạo nhanh | schema.sql tạo bảng và dữ liệu mẫu; .env.example mô tả cấu hình |

**4 Luồng nghiệp vụ tổng thể**

1. Chuẩn bị: ADMIN đăng nhập, thêm máy chủ SRV001 (có thể nhập phần cứng, bảo hành và chỉnh ngưỡng CPU/RAM).
2. Cấp khóa: quản trị backend cấp API\_KEY cho người làm agent.
3. Giám sát: agent định kỳ gửi POST /metrics với serverCode, CPU, RAM, mạng, Docker. Backend lưu vào history.
4. Đối chiếu ngưỡng: nếu CPU hoặc RAM vượt ngưỡng của máy đó, hoặc có container không chạy, backend tạo cảnh báo (nếu chưa có cảnh báo cùng loại đang mở) và đặt máy chủ ở WARNING.
5. Xử lý: OPERATOR xem danh sách cảnh báo OPEN, bấm xác nhận (ACKNOWLEDGED), xử lý sự cố.
6. Tự đóng: khi agent gửi số liệu bình thường, cảnh báo tự chuyển RESOLVED và máy chủ về ONLINE

**5 Công nghệ được sử dụng**

| **Thành phần** | **Công nghệ** |
| --- | --- |
| Framework | NestJS (Node.js, TypeScript) |
| Cơ sở dữ liệu | PostgreSQL, truy cập bằng TypeORM |
| Xác thực | JWT, mật khẩu băm bcrypt |
| Kiểm tra dữ liệu vào | class-validator (ValidationPipe, loại bỏ trường lạ) |
| Tài liệu API | Swagger tại /api |

