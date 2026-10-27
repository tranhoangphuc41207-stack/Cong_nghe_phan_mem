# 02\-auth\-requirements\.md

**1 Mục tiêu và phạm vi **

**1.1  Mục tiêu**

- Tài liệu này mô tả các yêu cầu xác thực và phân quyền của hệ thống AR-IMMS.
- Xác thực là quá trình kiểm tra danh tính người dùng khi truy cập hệ thống.
- Phân quyền là quá trình xác định những chức năng và dữ liệu mà người dùng được phép truy cập hoặc thao tác.
- Cơ chế xác thực và phân quyền nhằm bảo vệ thông tin hạ tầng, tài khoản người dùng, dữ liệu giám sát, phiếu bảo trì và các chức năng quản trị.

**1.2 Phạm vi **

Tài liệu bao gồm các nội dung:

- Đăng nhập và đăng xuất.
- Kiểm tra thông tin đăng nhập.
- Mã hóa một chiều mật khẩu để lưu trữ an toàn.
- Xác thực bằng JSON Web Token (JWT).
- Phân quyền theo vai trò (RBAC).
- Kiểm soát truy cập các API được bảo vệ.
- Xử lý lỗi xác thực và phân quyền.
- Bảo mật tài khoản và mật khẩu.
- Ghi nhận nhật ký liên quan đến xác thực.

**1.3 Danh sách chức năng của tài liệul**

| Nhóm | Chức năng |
| --- | --- |
| Đăng nhập | Đăng nhập |
| Đăng nhập | Kiểm tra định dạng dữ liệu đăng nhập |
| Đăng nhập | Đối chiếu mật khẩu |
| Đăng nhập | Kiểm tra trạng thái tài khoản |
| Đăng nhập | Cấp token |
| Đăng nhập | Xem thông tin người đang đăng nhập |
| Đăng nhập | Ghi nhật ký đăng nhập |
| Đăng nhập | Đăng xuất |
| Phân quyền | Xác thực token cho các API được bảo vệ |
| Phân quyền | Kiểm tra vai trò |
| Phân quyền | Khai báo quyền cho từng API |
| Phân quyền | Khai báo quyền cho cả nhóm API |
| Phân quyền | Các API công khai |
| API key | Kiểm tra API key |
| API key | Từ chối khi thiếu hoặc sai khóa |
| API key | So sánh khóa an toàn |
| API key | Bắt buộc cấu hình khóa |

**2. Yêu cầu nghiệp vụ (Business Requirements)**

Đây là lý do vì sao hệ thống cần phần xác thực và phân quyền:

- Chỉ người có tài khoản do quản trị viên cấp mới được dùng hệ thống, người ngoài không được vào.
- Mọi thao tác trên hệ thống phải gắn được với một người cụ thể, để khi có sự cố còn biết ai đã làm gì.
- Thông tin nhạy cảm như mật khẩu không bao giờ được để lộ, kể cả với quản trị viên.
- Số liệu giám sát chỉ được nhận từ nguồn đã được cấp khóa, để không ai gửi số liệu giả vào hệ thống.

**3. Yêu cầu người dùng (User Requirements)**

- **Người dùng bình thường** muốn đăng nhập bằng email và mật khẩu để sử dụng hệ thống, và khi đăng nhập thất bại muốn biết lý do để sửa lại. Họ cũng muốn xem được mình đang đăng nhập bằng tài khoản nào, vai trò gì để tránh nhầm lẫn.
- **Quản trị viên** muốn tài khoản bị khóa không đăng nhập được nữa, ví dụ khi một nhân viên nghỉ việc. Họ cũng muốn xem lịch sử đăng nhập thành công và thất bại để phát hiện người đang dò mật khẩu.
- **Agent giám sát** muốn gửi số liệu bằng một khóa cố định, không phải đăng nhập như người dùng thật.

**4. Quy tắc nghiệp vụ (Business Rules)**

1. Đăng nhập bằng cặp email và mật khẩu.
2. Sai email hoặc sai mật khẩu đều nhận cùng một thông báo, để người ngoài không biết email nào có trong hệ thống.
3. Tài khoản đã bị khóa không đăng nhập được. Thông báo riêng "tài khoản bị vô hiệu hóa" chỉ hiện khi mật khẩu đã đúng.
4. Token có hiệu lực 1 ngày, hết hạn thì phải đăng nhập lại.
5. Hệ thống có đúng 3 vai trò: quản trị (Admin), vận hành (Operator), kỹ thuật viên (Technician).
6. Quyền do backend kiểm soát. Việc ẩn hay hiện nút ở giao diện chỉ để người dùng đỡ bấm nhầm, không thay thế được việc kiểm tra ở backend.
7. Agent không dùng token đăng nhập mà dùng API key.
8. Không có chức năng tự đăng ký, tài khoản do quản trị viên tạo.
9. Mỗi lần đăng nhập, dù thành công hay thất bại, đều phải được ghi nhật ký.
10. API nào không quy định vai trò thì mọi người đã đăng nhập đều dùng được.

**5. Cấu hình liên quan**

| **Tham số** | **Đặt ở đâu** | **Giá trị** | **Ý nghĩa** |
| --- | --- | --- | --- |
| JWT-Secret | File .env | Chuỗi bí mật, càng dài càng tốt | Khóa dùng để ký và kiểm tra token. Thiếu thì ứng dụng không khởi động |
| API-key | File .env | Chuỗi ngẫu nhiên (khuyến nghị 48 ký tự hex) | Khóa agent dùng khi gửi số liệu. Thiếu thì ứng dụng không khởi động |
| Thời hạn token | Mã nguồn:auth.module.ts | 1 ngày (86400 giây) | Thời gian token còn hiệu lực |
| Thuật toán ký token | Mặc định của thư viện | HS256 | Ký đối xứng bằng JWT-Secret |
| Độ khó băm mật khẩu | Mã nguồn:users.service.ts | bcrypt, mức 10 | Mức tính toán khi băm mật khẩu |
| Nơi gửi token | Header | Authorization: Bearer token | Cách client đính kèm token |
| Nơi gửi API key | Header | x-api-key: \<khóa\> | Cách agent đính kèm khóa |

**6 Mô tả chi tiết từng chức năng**

**6.1 Nhóm đăng nhập**

**6.1.1 Đăng nhập**

Chức năng này làm gì: Cho phép người dùng chứng minh mình là ai bằng email và mật khẩu, rồi nhận về một token để dùng cho các API cần đăng nhập.

| **Mục** | **Nội dung** |
| --- | --- |
| **Ai dùng** | **Người dùng (ADMIN, OPERATOR, TECHNICIAN) qua giao diện web hoặc Swagger** |
| **Điều kiện để dùng** | **Tài khoản đã được quản trị viên tạo (hoặc tạo sẵn bằng SQL), Backend đang chạy và kết nối được cơ sở dữ liệu** |
| **Khi nào xảy ra** | **Người dùng gửi biểu mẫu đăng nhập** |
| **API** | **POST /auth/login, nội dung gửi dạng JSON** |
| **Quyền** | **Công khai, không cần token** |

**Dữ liệu gửi lên**

|  | **Kiểu** | **Bắt buộc** | **Quy định** | **Ví dụ** |
| --- | --- | --- | --- | --- |
| email | chuỗi | Có | Phải đúng định dạng email. So khớp chính xác và phân biệt chữ hoa, chữ thường với email đã lưu | admin@imms.local |
| password | chuỗi | Có | Phải là chuỗi. Chuỗi rỗng không bị chặn ở bước kiểm tra định dạng nhưng sẽ bị từ chối ở bước đối chiếu mật khẩu | 123456 |

Các trường khác ngoài hai trường trên sẽ bị bỏ qua.

Cách hoạt động, từng bước

- 
    - Người dùng gửi email và mật khẩu lên POST /auth/login.
    - Hệ thống kiểm tra định dạng dữ liệu 
    - Hệ thống tìm tài khoản theo email và lấy kèm mật khẩu đã băm.
    - Hệ thống đối chiếu mật khẩu người dùng nhập với mật khẩu đã băm 
    - Hệ thống kiểm tra tài khoản còn hoạt động không.
    - Hệ thống ghi nhật ký một dòng đăng nhập thành công
    - Hệ thống tạo token.
    - Hệ thống trả token cùng thông tin người dùng.
    - Giao diện lưu token lại và gửi kèm trong mọi yêu cầu sau đó.

Các trường hợp lỗi

| **Trường hợp** | **Hệ thống xử lý** | **Mã trả về** | **Thông báo** |
| --- | --- | --- | --- |
| Thiếu trường, hoặc email sai định dạng | Dừng ngay, không ghi nhật ký | 400 | Danh sách lỗi kiểm tra dữ liệu |
| Không có tài khoản nào với email này | Ghi nhật ký đăng nhập thất bại (không gắn với người dùng nào), dừng | 401 | Sai email hoặc mật khẩu |
| Mật khẩu không khớp | Ghi nhật ký đăng nhập thất bại, dừng | 401 | Sai email hoặc mật khẩu |
| Tài khoản đã bị khóa (mật khẩu đúng) | Ghi nhật ký đăng nhập thất bại, dừng | 401 | Tài khoản đã bị vô hiệu hóa |
| Nội dung gửi lên không phải JSON hợp lệ | Dừng | 400 | Lỗi định dạng JSON |
| Mất kết nối cơ sở dữ liệu | Dừng | 500 | Lỗi máy chủ |

**Kết quả sau khi chạy**

- Thành công: có một dòng "đăng nhập thành công" trong nhật ký, người dùng nhận được token.
- Thất bại do email, mật khẩu hoặc tài khoản bị khóa: có một dòng "đăng nhập thất bại" trong nhật ký, người dùng không nhận token.
- Thất bại do dữ liệu sai định dạng: không có dòng nhật ký nào, vì yêu cầu bị chặn trước khi vào xử lý đăng nhập.

**Dữ liệu trả về khi thành công (mã 201)**

|  | **Kiểu** | **Ý nghĩa** |
| --- | --- | --- |
| access\_token | chuỗi | Token dùng cho các API cần đăng nhập |
| user.id | số | Mã người dùng |
| user.fullName | chuỗi | Họ tên |
| user.email | chuỗi | Email |
| user.role | chuỗi | ADMIN, OPERATOR hoặc TECHNICIAN |

**6.1.2 Kiểm tra định dạng dữ liệu đăng nhập**

Chặn sớm các yêu cầu đăng nhập thiếu hoặc sai định dạng, trước khi hệ thống tốn công tìm trong cơ sở dữ liệu.

| Mục | Nội dung |
| --- | --- |
| Ai thực hiện | Hệ thống, hoàn toàn tự động |
| Khi nào xảy ra | Ngay khi nhận yêu cầu `POST /auth/login` |
| Cách làm | Bộ kiểm tra dữ liệu dùng chung của toàn ứng dụng, áp dụng các quy định khai báo cho dữ liệu đăng nhập |

**Quy định kiểm tra**

Khi sai, hệ thống sẽ trả về mã 400

|  | **Quy định** | **Thông báo khi vi phạm** |
| --- | --- | --- |
| **email** | **Bắt buộc có, phải là email hợp lệ** | **email must be an email** |
| **password** | **Bắt buộc có, phải là chuỗi** | **password must be a string** |
| **Trường hợp lạ** | **Bị loại bỏ khỏi dữ liệu, không gây lỗi** | **(không có)** |

**6.1.3 Đối chiếu mật khẩu**

So sánh mật khẩu người dùng vừa nhập với mật khẩu đã lưu trong cơ sở dữ liệu, để biết người nhập có đúng là chủ tài khoản không.

- Người thực hiện: hệ thống sẽ tự động quét
- Điều kiện để tìm thấy là tài khoản email
- Dữ liệu đầu vào sẽ do người dùng nhập thông tin mật khẩu vào 

→ Hệ thống sẽ so sánh kết quả có khớp hoặc không khớp hay không rồi cho kết quả

**Lưu ý**

- Mật khẩu gốc không bao giờ được ghi vào nhật ký hay trả về cho ai.
- Hệ thống chỉ so sánh khi email tồn tại. Khi email không tồn tại, hệ thống trả lỗi ngay mà không chạy bcrypt (xem hạn chế về thời gian phản hồi ở mục 11).
- bcrypt chỉ xét 72 byte đầu của mật khẩu.

**6.1.4 Kiểm tra trạng thái tài khoản**

Từ chối đăng nhập đối với tài khoản đã bị quản trị viên khóa.

**Cách thức hoạt động:**

- Tài khoản còn hoạt động: hệ thống đi tiếp để cấp token.
- Tài khoản đã bị khóa: hệ thống ghi nhật ký đăng nhập thất bại với lý do "Tài khoản bị vô hiệu hóa" và trả mã `401` với thông báo "Tài khoản đã bị vô hiệu hóa

**6.1.5 Cấp token**

Tạo một token đã ký, để giao diện chứng minh danh tính ở các yêu cầu sau mà không phải gửi lại mật khẩu

- Hệ thống sẽ tự động xem và so điều kiện mật khẩu,tài khoản còn hoạt động không rồi mới trả token 

|  | Giá trị | Ý nghĩa |
| --- | --- | --- |
| sub | Mã người dùng | Xác định người dùng |
| email | Email | Hiển thị và ghi nhật ký |
| role | Vai trò | Dùng để phân quyền |
| iat | Thời điểm cấp | Thư viện tự thêm |
| exp | Thời điểm hết hạn | Thời điểm cấp cộng 1 ngày |

**Cách hoạt động:**

- Tạo nội dung gồm mã người dùng, email và vai trò.
- Ký bằng JWT\_SECRET theo thuật toán HS256, hạn 1 ngày.
- Trả token trong nội dung phản hồi (không đặt vào cookie).

**Lưu ý:**

- Token chỉ được ký, không được mã hóa: ai cầm token cũng đọc được nội dung bên trong. Vì vậy mật khẩu và thông tin nhạy cảm không được đưa vào token.
- Vai trò nằm trong token, nên nếu vai trò của một người đổi (hiện chưa có chức năng này), họ phải đăng nhập lại thì mới có hiệu lực.

**6.1.6 Xem thông tin người đang đăng nhập**

Cho giao diện biết token đang dùng thuộc về ai và vai trò gì, để hiển thị tên và ẩn hiện các chức năng phù hợp.

| Mục | Nội dung |
| --- | --- |
| Người dùng | Mọi người đã đăng nhập |
| Điều kiện | Có token hợp lệ và chưa hết hạn |
| API | GET /auth/me |
| Quyền | Mọi vai trò đã đăng nhập |
| Dữ liệu vào | Header Authorization: Bearer \<access\_token\> |

**Cách hoạt động**

- Hệ thống xác thực token 
- Hệ thống trả lại thông tin lấy từ token

→ Khi dữ liệu thành công sẽ trả về mã 200 với mã người dùng, Emali và vai trò ngoài ra nếu lỗi nhữ là hết token hoặc hết hạn thì sẽ trả mã 401

**6.1.7 Ghi nhật ký đăng nhập**

Ghi lại mỗi lần đăng nhập để quản trị viên truy vết và phát hiện người dò mật khẩu.

Nội dung ghi theo từng trường hợp:

| Trường hợp | Hành động ghi | Người dùng | Đối tượng | Chi tiết |
| --- | --- | --- | --- | --- |
| Đăng nhập thành công | LOGIN | Mã người dùng | USER, mã người dùng | email |
| Sai mật khẩu (email có tồn tại) | LOGIN\_FAILED | Mã người dùng | USER, mã người dùng | email và lý do "Sai email hoặc mật khẩu" |
| Email không tồn tại | LOGIN\_FAILED | Để trống | USER, để trống | email và lý do "Sai email hoặc mật khẩu" |
| Tài khoản bị khóa | LOGIN\_FAILED | Mã người dùng | USER, mã người dùng | email và lý do "Tài khoản bị vô hiệu hóa" |


**Cách hoạt động**

- Việc ghi được thực hiện trước khi trả phản hồi cho người dùng.
- Nếu việc ghi nhật ký gặp lỗi, hệ thống chỉ báo trong console và không làm hỏng kết quả đăng nhập.
- Mật khẩu không bao giờ được ghi.
- Yêu cầu bị chặn ở bước kiểm tra định dạng (mã 400) không được ghi.

**6.1.8 Đăng xuất**

Trạng thái: chỉ làm ở phía client, server chưa hỗ trợ.

Hệ thống dùng token không lưu trạng thái, nên server không giữ danh sách phiên đăng nhập. Hiện tại, giao diện chỉ cần xóa token đã lưu rồi đưa người dùng về màn hình đăng nhập.

Hạn chế: nếu token đã bị sao chép trước đó, nó vẫn dùng được cho đến khi hết hạn vì không có API đăng xuất hay thu hồi token. Hướng cải tiến là lưu danh sách token bị thu hồi, hoặc rút ngắn thời hạn token kèm cơ chế làm mới.

**6.2 Nhóm phân quyền theo vai trò**

**6.2.1 Xác thực token cho các API được bảo vệ**

Với mọi API cần đăng nhập, kiểm tra token có hợp lệ không trước khi cho vào xử lý, và xác định ai đang gọi

**Cách hoạt động**

- Lấy token từ header Authorization theo dạng Bearer.
- Kiểm tra chữ ký bằng JWT\_SECRET và kiểm tra token chưa hết hạn.
- Lấy mã người dùng, email, vai trò từ token và gắn vào yêu cầu, thành "người dùng hiện tại".
- Cho yêu cầu đi tiếp.

Các trường hợp bị từ chối tất cả đều trả mã 401 với thông báo chung, không cho client biết cụ thể lý do.

| **Trường hợp** | **Mô tả** |
| --- | --- |
| Không có token | Thiếu header Authorization |
| Sai cách gửi | Header không đúng dạng Bearer \<token\> |
| Token giả | Chữ ký sai, hoặc ký bằng khóa khác |
| Token hết hạn | Đã quá 1 ngày kể từ lúc cấp |
| Token hỏng | Không đọc được nội dung |

**6.2.2 Kiểm tra vai trò**

Sau khi biết người gọi là ai, kiểm tra vai trò của họ có nằm trong danh sách được phép của API đó không.

- Hệ thống sẽ thực hiện tự động xem các điều kiện đã qua các bước xác thực token

- Đọc danh sách vai trò được khai báo cho API Nếu API không khai báo vai trò, hoặc danh sách rỗng: cho qua, tức là mọi người đã đăng nhập đều dùng được.
- Ngược lại, nếu có người dùng hiện tại và vai trò của họ nằm trong danh sách: cho qua.
- Trường hợp còn lại: từ chối.

Phân biệt mã 401 và 403

| **Mã** | **Ý nghĩa** | **Giao diện nên làm** |
| --- | --- | --- |
| 401 | Chưa xác định được bạn là ai | Xóa token, chuyển về trang đăng nhập |
| 403 | Biết bạn là ai nhưng bạn không có quyền | Báo "Bạn không có quyền", giữ nguyên phiên đăng nhập |

Hai bước này sẽ chạy theo thứ tự: xác thực token trước, kiểm tra vai trò sau. Nếu thiếu bước xác thực thì sẽ không có người dùng hiện tại và kết quả là bị từ chối.

**6.2.3 Khai báo quyền cho từng API**

Mỗi API ghi rõ những vai trò nào được gọi, bằng chú thích Roles(...) đặt ngay trên hàm xử lý. Người lập trình chỉ cần đọc chú thích là biết API đó dành cho ai.

| **API** | **Khai báo** | **Kết quả** |
| --- | --- | --- |
| servers | Roles(ADMIN) | Chỉ ADMIN |
| servers/:id/status | Roles(ADMIN, OPERATOR) | ADMIN và OPERATOR |
| alerts/:id/acknowledge | Roles(ADMIN, OPERATOR) | ADMIN và OPERATOR |
| GET /servers | (không khai báo) | Mọi người đã đăng nhập |

**6.2.4 Khai báo quyền cho cả nhóm API**

Gắn một quyền cho cả nhóm API để khỏi phải lặp lại ở từng API.

| Nhóm | Cách khai báo | Kết quả |
| --- | --- | --- |
| /users (tất cả) | @Roles(ADMIN) ở mức nhóm | Chỉ ADMIN |
| /audit-logs | @Roles(ADMIN) ở mức nhóm | Chỉ ADMIN |
| /servers, /alerts | Khai báo riêng từng API | Theo ma trận |

**6.2.5 Các API công khai**

| Đường dẫn | Mục đích | Ghi chú |
| --- | --- | --- |
| POST /auth/login | Đăng nhập | Bắt buộc phải công khai |
| GET / | Trang chào mặc định của dự án | Không chứa dữ liệu nghiệp vụ |
| /api (và /api-json) | Tài liệu Swagger | Nên hạn chế khi triển khai thật |
| POST /metrics | Agent gửi số liệu | Không hoàn toàn công khai: phải có API key |

**6.3 Nhóm API key cho agent**

**6.3.1 Kiểm tra API key**

Bảo đảm chỉ chương trình agent nắm khóa mới gửi được số liệu giám sát.

**Cách hoạt động**

- Agent gửi yêu cầu kèm header x-api-key.
- Hệ thống lấy giá trị header và so với API\_KEY trong cấu hình 
- Nếu khớp thì cho đi tiếp xử lý số liệu. Nếu không khớp thì từ chối

Lưu ý:

API key và token đăng nhập là hai cơ chế độc lập. Agent không cần đăng nhập, và token đăng nhập không thay thế được API key.

**6.3.2 Từ chối khi thiếu hoặc sai khóa**

| **Trường hợp** | **Kết quả** |
| --- | --- |
| Không có header x-api-key | Mã 401 |
| Có header nhưng không phải chuỗi hợp lệ | Mã 401 |
| Giá trị không khớp khóa trong cấu hình | Mã 401 |

Hệ thống dùng một thông báo duy nhất cho mọi trường hợp, để không gợi ý gì cho người đang dò khóa.

**6.3.3 So sánh khóa an toàn**

So sánh thông thường sẽ dừng ngay ở ký tự sai đầu tiên, nên có ai đột nhập có thể đo thời gian phản hồi để đoán dần từng ký tự. Để tránh việc này, hệ thống kiểm tra hai chuỗi cùng độ dài rồi dùng hàm so sánh có thời gian không đổi.

**6.3.4 Bắt buộc cấu hình khóa**

Khi khởi động, hệ thống đọc API\_KEY từ file .env. Nếu chưa có thì ứng dụng dừng và báo lỗi cấu hình, nhằm tránh việc vô tình chạy mà không có lớp bảo vệ. JWT\_SECRET cũng được xử lý tương tự.

Giới hạn: hệ thống mới kiểm tra khóa có tồn tại, chưa kiểm tra khóa có rỗng hay không

**7 Giao diện bên ngoài (API) tổng hợp**

| **Method** | **Đường dẫn** | **Mô tả** | **Xác thực** |
| --- | --- | --- | --- |
| POST | /auth/login | Đăng nhập | Không cần |
| GET | /auth/me | Thông tin người đang đăng nhập | Token |
| POST | /metrics | Agent gửi số liệu | x-api-key |

**7.1 Bảng mã lỗi**

| **Mã** | **Tình huống** | **Nội dung** |
| --- | --- | --- |
| 400 | Email sai định dạng, thiếu trường, JSON hỏng | Danh sách lỗi kiểm tra dữ liệu |
| 401 | Sai email hoặc mật khẩu | "Sai email hoặc mật khẩu" |
| 401 | Tài khoản bị khóa (mật khẩu đúng) | "Tài khoản đã bị vô hiệu hóa" |
| 401 | Thiếu token, token sai hoặc hết hạn | "Unauthorized" |
| 401 | Thiếu hoặc sai API key | "Thiếu hoặc sai API key" |
| 403 | Vai trò không đủ quyền | "Forbidden resource" |
| 500 | Lỗi hệ thống, ví dụ mất kết nối cơ sở dữ liệu | Lỗi máy chủ |

**8 Ma trận phân quyền**

| Chức năng API | Quản trị viên (ADMIN) | Nhân viên vận hành (OPERATOR) | Kỹ thuật viên (TECHNICIAN) |
| --- | --- | --- | --- |
| Đăng nhập (POST /auth/login) | Có | Có | Có |
| Xem thông tin tài khoản hiện tại | Có | Có | Có |
| Quản lý người dùng | Có | Không | Không |
| Xem danh sách máy chủ, chi tiết máy chủ và máy chủ sắp hết hạn bảo hành | Có | Có | Có |
| Thêm, chỉnh sửa, cập nhật ngưỡng cảnh báo và xóa máy chủ | Có | Không | Không |
| Cập nhật trạng thái máy chủ | Có | Có | Không |
| Xem thông số giám sát của máy chủ | Có | Có | Có |
| Gửi thông số giám sát lên hệ thống | Sử dụng API Key | Sử dụng API Key | Sử dụng API Key |
| Xem danh sách cảnh báo và chi tiết cảnh báo | Có | Có | Có |
| Xác nhận và xử lý cảnh báo | Có | Có | Không |
| Xem nhật ký hoạt động hệ thống | Có | Không | Không |

**9 Dữ liệu liên quan**

| **Cột** | **Kiểu** | **Vai trò trong xác thực** |
| --- | --- | --- |
| id | SERIAL | Khóa chính, đưa vào token (sub) |
| email | VARCHAR(150), duy nhất | Tên đăng nhập |
| password\_hash | TEXT | Mật khẩu đã băm bcrypt, mặc định không đọc khi truy vấn thông thường |
| role | VARCHAR(20), chỉ nhận ADMIN, OPERATOR, TECHNICIAN | Vai trò, đưa vào token |
| is\_active | BOOLEAN, mặc định TRUE | Cho phép đăng nhập hay không |

**10. Yêu cầu chất lượng**

| Nhóm | Yêu cầu |
| --- | --- |
| Bảo mật | Mật khẩu băm bcrypt, không lưu dạng gốc |
| Bảo mật | Không bao giờ trả mật khẩu đã băm ra API |
| Bảo mật | JWT\_SECRET và API\_KEY chỉ nằm trong .env, không đưa lên GitHub |
| Bảo mật | So sánh API key theo thời gian không đổi |
| Bảo mật | Thông báo đăng nhập sai không tiết lộ email có tồn tại |
| Tin cậy | Token hết hạn sau 1 ngày để giảm rủi ro khi bị lộ |
| Truy vết | Mọi lần đăng nhập, thành công hay thất bại, đều được ghi nhật ký |
| Dễ tích hợp | Mã lỗi nhất quán (400, 401, 403) và có trên Swagger |
| Hiệu năng | Kiểm tra token không truy vấn cơ sở dữ liệu nên nhanh. Chi phí chính nằm ở bcrypt khi đăng nhập |

**11. Hạn chế đã biết và đề xuất**

| **Hạn chế** | **Tác động** | **Đề xuất cải tiến** |
| --- | --- | --- |
| **Khóa tài khoản không thu hồi token đã cấp** | Người bị khóa vẫn dùng được token cũ cho đến khi hết hạn, tối đa 1 ngày | Kiểm tra tình trạng tài khoản mỗi lần xác thực, hoặc rút ngắn thời hạn token |
| **Không giới hạn số lần đăng nhập sai** | Người ngoài có thể thử mật khẩu liên tục | Thêm giới hạn tần suất hoặc khóa tạm |
| **Không có làm mới token** | Người dùng phải đăng nhập lại sau 1 ngày | Thêm cơ chế refresh token |
| **Không có đổi mật khẩu, quên mật khẩu** | Người dùng không tự đổi được mật khẩu | Bổ sung API đổi mật khẩu |
| **Dùng HTTP** | Token và khóa có thể bị nghe lén trong mạng | Dùng HTTPS khi triển khai thật |
| **Một API key dùng chung cho mọi agent** | Lộ khóa của một agent là lộ cho tất cả | Cấp khóa riêng cho từng máy chủ |
| **Thời gian phản hồi khác nhau giữa email tồn tại và không tồn tại** | bcrypt chỉ chạy khi email tồn tại, nên có thể dùng thời gian để dò email | So sánh với một chuỗi băm giả khi email không tồn tại |
| **Chưa kiểm tra khóa cấu hình để trống** | Nếu API\_KEY hoặc JWT\_SECRET để trống, ứng dụng vẫn khởi động | Bắt buộc không rỗng và đủ độ dài tối thiểu khi khởi động |
| **Email phân biệt chữ hoa, chữ thường** | Admin@imms.local khác admin@imms.local | Chuẩn hóa email về chữ thường khi lưu và khi đăng nhập |
| **Trang Swagger công khai** | Ai truy cập được máy chủ đều xem được danh sách API | Hạn chế hoặc tắt khi triển khai thật |


