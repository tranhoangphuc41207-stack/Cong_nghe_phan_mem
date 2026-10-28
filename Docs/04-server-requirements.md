04. Yêu cầu quản lý máy chủ và tài sản hạ tầng
1. Mục đích
Tài liệu này mô tả yêu cầu quản lý Rack, Server/Node, Workload và hồ sơ tài sản của hệ thống AR-IMMS. Phạm vi bao gồm tra cứu, đăng ký, cập nhật, ngừng quản lý thiết bị, gán mã QR/ArUco, quản lý thông số phần cứng, bảo hành và lịch sử bảo trì.

2. Phạm vi và tác nhân
2.1. Trong phạm vi
Quản lý danh sách Rack, Server/Node và Workload.

Đăng ký, cập nhật và ngừng quản lý thiết bị.

Gán hoặc cập nhật mã QR/ArUco cho Server/Node.

Quản lý thông số phần cứng, thông tin bảo hành và lịch sử bảo trì.

Ghi nhận các thay đổi thuộc danh mục kiểm toán của hệ thống.

2.2. Ngoài phạm vi
Thu thập, lưu trữ và truy vấn telemetry: xem 05-metrics-requirements.md.

Cấu hình ngưỡng, phát hiện bất thường và quản lý vòng đời cảnh báo: xem 06-alert-requirements.md.

Xác thực và phân quyền dùng chung: xem 02-auth-requirements.md.

Cấu trúc bản ghi và chính sách audit log: xem 07-audit-logs-requirements.md.

2.3. Tác nhân và tham chiếu SRS
Nội dung

Tham chiếu

Tác nhân chính

System Operator (OPERATOR), theo phần chức năng quản lý thiết bị và tài sản trong SRS.

Use Case

UC-06 – Quản lý Rack, Server, Workload và gán mã QR/ArUco; UC-11 – Quản lý phần cứng, bảo hành và lịch sử bảo trì.

Yêu cầu chức năng

FR-O1, FR-O2, FR-O8.

Màn hình

SO-03 – Quản lý thiết bị; SO-07 – Quản lý tài sản.

3. Mô hình dữ liệu quản lý
AR-IMMS tổ chức hạ tầng theo cấu trúc Site → Room → Rack → Node → Container. Workload/Container phải được liên kết với Node tương ứng; các liên kết phải nhất quán với cấu trúc Digital Twin.

Đối tượng

Thông tin chính

Quy tắc liên quan

Rack

Mã, tên, Room, vị trí trong phòng, sức chứa theo đơn vị U, mô tả, trạng thái quản lý

Rack thuộc một Room; mã Rack duy nhất trong Room.

Server/Node

Hostname, Rack, địa chỉ IP, hệ điều hành, mô tả, mã QR/ArUco, trạng thái kết nối và trạng thái quản lý

Server/Node phải liên kết với Rack phù hợp; hostname và IP duy nhất theo BR-04 (đề xuất trong SRS).

Workload/Container

Tên, loại, Node chạy workload và trạng thái do hệ thống thu thập hỗ trợ

Workload phải liên kết với Node tương ứng.

Hồ sơ tài sản

Tên thiết bị, loại, hãng/model, số serial, hạn và trạng thái bảo hành

Số serial duy nhất theo BR-04 (đề xuất trong SRS).

Thông số phần cứng và bảo hành

CPU, RAM, ổ đĩa, card mạng, số serial, nhà cung cấp, ngày mua, ngày bắt đầu và hết hạn bảo hành

Ngày hết hạn bảo hành không được trước ngày bắt đầu.

Lịch sử bảo trì

Ngày thực hiện, loại bảo trì, mô tả, người thực hiện, Ticket liên quan (nếu có)

Giữ lại lịch sử để tra cứu; không xóa trực tiếp bản ghi lịch sử.

Trạng thái kết nối như ONLINE, WARNING, OFFLINE khác với trạng thái quản lý như Active hoặc Inactive; hai loại trạng thái không được dùng thay thế cho nhau.

4. Yêu cầu chức năng
SRV-01. Xem, tìm kiếm và lọc thiết bị
Tham chiếu: FR-O1, UC-06, SO-03. Ưu tiên: Cao.

Hệ thống cung cấp danh sách Rack, Server/Node và Workload. Danh sách Server hiển thị tối thiểu Hostname, Rack, địa chỉ IP, mã QR/ArUco, trạng thái kết nối và trạng thái quản lý. Người vận hành có thể tìm kiếm theo tên, Hostname hoặc mã QR/ArUco và lọc theo Room, Rack hoặc trạng thái.

Kết quả mong đợi: Danh sách phản ánh đúng dữ liệu đã lưu và điều kiện lọc; khi không có kết quả, hệ thống hiển thị trạng thái rỗng rõ ràng.

SRV-02. Đăng ký Rack
Tham chiếu: FR-O1, UC-06, SO-03. Ưu tiên: Cao.

Khi tạo Rack, hệ thống nhận mã Rack, tên, Room, vị trí trong phòng, sức chứa theo đơn vị U và mô tả. Room được chọn phải đang hoạt động; mã Rack phải duy nhất trong Room. Rack mới phải xuất hiện trong danh sách và cấu trúc Digital Twin sau khi lưu thành công.

Thao tác tạo Rack được ghi nhận theo danh mục audit log tại 07-audit-logs-requirements.md với action RACK_CREATE.

SRV-03. Đăng ký và cập nhật Server/Node, Workload
Tham chiếu: FR-O1, UC-06, SO-03. Ưu tiên: Cao.

Hệ thống cho phép đăng ký Server/Node với Hostname, Rack, địa chỉ IP, hệ điều hành và mô tả. Rack phải đang hoạt động; Hostname và địa chỉ IP phải duy nhất theo quy tắc BR-04 (đề xuất trong SRS). Mã QR/ArUco có thể được gán khi đăng ký hoặc qua SRV-04.

Người vận hành có thể cập nhật thông tin mô tả, chuyển Server sang Rack khác và quản lý thông tin Workload theo thiết kế của hệ thống. Sau khi Agent gửi telemetry đầu tiên, Node mới phải xuất hiện trong Digital Twin trong vòng 5 phút theo mục tiêu NFR-05.

Các thao tác tạo/cập nhật thiết bị được ghi nhận theo danh mục audit log, gồm SERVER_CREATE và DEVICE_UPDATE khi phù hợp.

SRV-04. Gán hoặc cập nhật mã QR/ArUco
Tham chiếu: FR-O2, UC-06, SO-03. Ưu tiên: Cao.

Hệ thống cho phép gán mã QR/ArUco cho Server/Node để ứng dụng Mobile AR nhận diện đúng thiết bị.

Mỗi mã chỉ được gán cho tối đa một Node tại cùng thời điểm (BR-10).

Khi thay hoặc chuyển thiết bị, mã cũ phải được giải phóng trước khi gán lại.

Việc gán hoặc cập nhật mã phải được ghi audit log với action MARKER_ASSIGN.

Kết quả mong đợi: Không thể gán cùng một mã cho hai Node; mã được liên kết với đúng thiết bị sau khi lưu.

SRV-05. Cập nhật và ngừng quản lý thiết bị
Tham chiếu: FR-O1, UC-06, SO-03.

Hệ thống cho phép cập nhật thông tin thiết bị và ngừng quản lý thiết bị khi không còn sử dụng. Trước khi ngừng quản lý, hệ thống yêu cầu xác nhận. Theo BR-18 (đề xuất trong SRS), không được ngừng Rack còn Node đang Active hoặc Node còn Ticket chưa đóng.

Ngừng quản lý phải chuyển đối tượng sang trạng thái Inactive, không xóa vật lý bản ghi và không làm mất dữ liệu lịch sử. Mã QR/ArUco liên quan được giải phóng theo BR-10. Các thao tác cập nhật và ngừng quản lý được ghi audit log với action DEVICE_UPDATE hoặc DEVICE_DEACTIVATE khi phù hợp.

SRV-06. Xem và cập nhật hồ sơ tài sản
Tham chiếu: FR-O8, UC-11, SO-07. Ưu tiên: Trung bình.

Danh sách tài sản hiển thị tên thiết bị, loại, hãng/model, số serial, hạn bảo hành và trạng thái bảo hành. Hồ sơ chi tiết gồm thông số phần cứng, thông tin bảo hành và lịch sử bảo trì.

Hệ thống cho phép cập nhật CPU, RAM, ổ đĩa, card mạng, số serial, nhà cung cấp, ngày mua, ngày bắt đầu và hết hạn bảo hành. Số serial phải duy nhất theo BR-04 (đề xuất); ngày hết hạn không được trước ngày bắt đầu. Thay đổi hồ sơ tài sản được ghi audit log với action ASSET_UPDATE.

Theo BR-17 (đề xuất trong SRS), hệ thống cảnh báo khi tài sản sắp hết hạn bảo hành; số ngày báo trước có thể cấu hình và giá trị mặc định 30 ngày cần được nhóm thống nhất.

SRV-07. Ghi nhận lịch sử bảo trì
Tham chiếu: FR-O8, UC-11, SO-07.

Lịch sử bảo trì ghi nhận ngày thực hiện, loại bảo trì, mô tả, người thực hiện và Ticket liên quan nếu có. Ticket được đóng thành công phải tạo bản ghi lịch sử bảo trì cho thiết bị liên quan theo SRS.

Bản ghi lịch sử không được xóa trực tiếp. Sai sót được xử lý bằng bản ghi hiệu chỉnh và được ghi audit log. Tạo bản ghi bảo trì được ghi nhận với action MAINTENANCE_RECORD_CREATE.

5. Quy tắc nghiệp vụ
Mã

Quy tắc

BR-04

Hostname, địa chỉ IP và số serial phải duy nhất; quy tắc này được đánh dấu là đề xuất trong SRS.

BR-05

Tài khoản/thiết bị được vô hiệu hóa hoặc ngừng quản lý thay vì xóa vật lý; dữ liệu lịch sử được giữ lại.

BR-09

Duy trì phân cấp Site → Room → Rack → Node → Container.

BR-10

Mỗi mã QR/ArUco chỉ gán cho một Node; giải phóng mã cũ khi thay hoặc chuyển thiết bị.

BR-17

Cảnh báo thiết bị sắp hết bảo hành; thời gian báo trước cấu hình được, mặc định đề xuất 30 ngày.

BR-18

Không ngừng Rack có Node Active hoặc Node còn Ticket chưa đóng; quy tắc được đánh dấu là đề xuất trong SRS.

6. Kịch bản kiểm thử nghiệm thu
Mã

Kịch bản

Kết quả mong đợi

TC-SRV-01

Xem danh sách và lọc Server theo Rack/trạng thái

Danh sách phản ánh đúng điều kiện đã chọn.

TC-SRV-02

Tạo Rack với mã hợp lệ và Room đang hoạt động

Rack được lưu và liên kết đúng Room.

TC-SRV-03

Tạo Rack trùng mã trong cùng Room

Hệ thống từ chối thao tác.

TC-SRV-04

Đăng ký Server với Hostname/IP đã tồn tại

Hệ thống từ chối dữ liệu trùng theo quy tắc đã thống nhất.

TC-SRV-05

Gán mã QR/ArUco đang dùng bởi Node khác

Hệ thống từ chối gán trùng.

TC-SRV-06

Ngừng Rack có Node Active hoặc Node còn Ticket chưa đóng

Hệ thống chặn thao tác nếu BR-18 được nhóm chốt áp dụng.

TC-SRV-07

Cập nhật serial hoặc ngày bảo hành không hợp lệ

Hệ thống từ chối dữ liệu không hợp lệ.

TC-SRV-08

Đóng Ticket và kiểm tra lịch sử bảo trì

Có bản ghi lịch sử bảo trì liên quan đến thiết bị.

TC-SRV-09

Tạo/cập nhật/ngừng quản lý thiết bị

Có bản ghi audit log với action tương ứng theo tài liệu 07.

7. Tài liệu liên quan
01-overview.md – Tổng quan, phạm vi và thuật ngữ dự án.

02-auth-requirements.md – Xác thực và phân quyền.

05-metrics-requirements.md – Thu thập, lưu trữ và truy vấn telemetry.

06-alert-requirements.md – Ngưỡng và vòng đời cảnh báo.

07-audit-logs-requirements.md – Danh mục action và quy định audit log.

08-non-functional-requirements.md – Yêu cầu phi chức năng và tiêu chí đánh giá.

Tham chiếu SRS: FR-O1, FR-O2, FR-O8; UC-06, UC-11; SO-03, SO-07; BR-04, BR-05, BR-09, BR-10, BR-17, BR-18.
