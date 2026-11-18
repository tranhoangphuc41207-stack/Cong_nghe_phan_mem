# nhom-3 CNPM
# LINK DOC
https://tranhoangphuc41207.atlassian.net/wiki/x/AYD7
# Architecture
```bash
ar-imms-backend/
│
├── src/
│   │
│   ├── alerts/
│   │   ├── alert.entity.ts                  # Định nghĩa cấu trúc bảng alerts trong PostgreSQL
│   │   ├── alerts.controller.ts             # Tiếp nhận API quản lý cảnh báo
│   │   ├── alerts.gateway.ts                # Đẩy cảnh báo realtime qua Socket.IO, xác thực JWT khi kết nối
│   │   ├── alerts.module.ts                 # Đăng ký và liên kết các thành phần của module cảnh báo
│   │   └── alerts.service.ts                # Xử lý nghiệp vụ tạo, xem và cập nhật cảnh báo
│   │
│   ├── audit-logs/
│   │   ├── audit-log.entity.ts              # Định nghĩa cấu trúc bảng audit_logs trong PostgreSQL
│   │   ├── audit-logs.controller.ts         # Tiếp nhận API xem nhật ký hoạt động
│   │   ├── audit-logs.module.ts             # Đăng ký module nhật ký hoạt động
│   │   ├── audit-logs.service.ts            # Xử lý nghiệp vụ truy xuất nhật ký
│   │   └── audit.interceptor.ts             # Ghi nhận hoạt động của người dùng vào nhật ký
│   │
│   ├── auth/
│   │   ├── dto/
│   │   │   └── login.dto.ts                 # Kiểm tra dữ liệu gửi lên khi đăng nhập
│   │   ├── auth.controller.ts               # Tiếp nhận API đăng nhập và xác thực
│   │   ├── auth.module.ts                   # Đăng ký module xác thực
│   │   ├── auth.service.ts                  # Xử lý đăng nhập, kiểm tra tài khoản và tạo JWT
│   │   ├── jwt-auth.guard.ts                # Bảo vệ API bằng token JWT
│   │   └── jwt.strategy.ts                  # Kiểm tra và giải mã JWT
│   │
│   ├── common/
│   │   ├── role.enum.ts                     # Khai báo các vai trò ADMIN, OPERATOR, TECHNICIAN
│   │   ├── roles.decorator.ts               # Khai báo quyền truy cập cho từng API
│   │   └── roles.guard.ts                   # Kiểm tra quyền truy cập theo vai trò
│   │
│   ├── metrics/
│   │   ├── dto/
│   │   │   └── create-metric.dto.ts         # Kiểm tra dữ liệu thông số máy chủ gửi lên
│   │   ├── api-key.guard.ts                 # Xác thực API Key khi Agent gửi thông số
│   │   ├── history.entity.ts                # Định nghĩa cấu trúc bảng history trong PostgreSQL
│   │   ├── metrics.controller.ts            # Tiếp nhận API gửi và xem thông số máy chủ
│   │   ├── metrics.module.ts                # Đăng ký module quản lý thông số
│   │   └── metrics.service.ts               # Xử lý lưu trữ và truy xuất thông số máy chủ
│   │
│   ├── servers/
│   │   ├── dto/
│   │   │   ├── create-server.dto.ts         # Kiểm tra dữ liệu khi tạo máy chủ
│   │   │   ├── update-server.dto.ts         # Kiểm tra dữ liệu khi cập nhật máy chủ
│   │   │   ├── update-status.dto.ts         # Kiểm tra dữ liệu khi cập nhật trạng thái
│   │   │   └── update-thresholds.dto.ts     # Kiểm tra ngưỡng CPU và RAM
│   │   ├── server-status.enum.ts            # Khai báo các trạng thái máy chủ
│   │   ├── server.entity.ts                 # Định nghĩa cấu trúc bảng servers trong PostgreSQL
│   │   ├── servers.controller.ts            # Tiếp nhận API quản lý máy chủ
│   │   ├── servers.module.ts                # Đăng ký module quản lý máy chủ
│   │   └── servers.service.ts               # Xử lý nghiệp vụ thêm, sửa, xóa và truy vấn máy chủ
│   │
│   ├── tickets/
│   │   ├── maintenance-log.entity.ts        # Định nghĩa cấu trúc bảng maintenance_logs trong PostgreSQL
│   │   ├── ticket.entity.ts                 # Định nghĩa cấu trúc bảng tickets trong PostgreSQL
│   │   ├── ticket.enums.ts                  # Khai báo trạng thái và mức ưu tiên của phiếu bảo trì
│   │   └── tickets.module.ts                # Đăng ký Entity với ORM (controller, service sẽ bổ sung sau)
│   │
│   ├── users/
│   │   ├── dto/
│   │   │   ├── create-user.dto.ts           # Kiểm tra dữ liệu khi tạo tài khoản
│   │   │   └── update-user-role.dto.ts      # Kiểm tra dữ liệu khi thay đổi vai trò người dùng
│   │   ├── user.entity.ts                   # Định nghĩa cấu trúc bảng users trong PostgreSQL
│   │   ├── users.controller.ts              # Tiếp nhận API quản lý người dùng
│   │   ├── users.module.ts                  # Đăng ký module quản lý người dùng
│   │   └── users.service.ts                 # Xử lý nghiệp vụ quản lý tài khoản
│   │
│   ├── app.controller.ts                    # Tiếp nhận các API chung của ứng dụng
│   ├── app.controller.spec.ts               # Kiểm thử AppController
│   ├── app.module.ts                        # Module gốc, cấu hình PostgreSQL và liên kết các module
│   ├── app.service.ts                       # Xử lý nghiệp vụ chung của ứng dụng
│   └── main.ts                              # Điểm khởi chạy, cấu hình CORS, validation và Swagger
│
├── test/
│   ├── app.e2e-spec.ts                      # Kiểm thử hoạt động API theo luồng thực tế
│   └── jest-e2e.json                        # Cấu hình kiểm thử End-to-End
│
├── collector-agent/
│   ├── scripts/
│   │   └── gen-certs.sh                     # Tạo CA và chứng chỉ server/client để thử mTLS
│   ├── src/
│   │   ├── collectors/
│   │   │   ├── docker.ts                    # Thu số liệu Container qua Docker Engine API
│   │   │   └── system.ts                    # Thu CPU, RAM và lưu lượng mạng của máy chủ
│   │   ├── buffer.ts                        # Hàng đợi đệm dữ liệu, khi đầy bỏ bản cũ nhất
│   │   ├── config.ts                        # Đọc cấu hình Agent (địa chỉ Backend, API Key, chứng chỉ)
│   │   ├── index.ts                         # Điểm khởi chạy, định kỳ thu thập và gửi telemetry
│   │   ├── payload.ts                       # Chuyển dữ liệu thu được sang định dạng Backend yêu cầu
│   │   ├── sender.ts                        # Gửi POST /metrics về Backend, hỗ trợ mTLS và gửi bù khi lỗi
│   │   └── types.ts                         # Khai báo kiểu dữ liệu telemetry gửi về Backend
│   ├── test/
│   │   └── agent.test.ts                    # Kiểm thử hoạt động của Agent
│   ├── docker-compose.yml                   # Chạy thử mô hình Mini Data Center cùng Agent
│   ├── Dockerfile                           # Đóng gói Agent thành Docker image
│   └── package.json                         # Khai báo script và phiên bản Node của Agent
│
├── web/
│   ├── src/
│   │   ├── app/
│   │   │   ├── (dashboard)/
│   │   │   │   ├── alerts/page.tsx          # Trang xem và xử lý cảnh báo
│   │   │   │   ├── dashboard/page.tsx       # Trang tổng quan hệ thống
│   │   │   │   ├── hardware/page.tsx        # Trang thông tin phần cứng
│   │   │   │   ├── infrastructure/page.tsx  # Trang hạ tầng
│   │   │   │   ├── reports/
│   │   │   │   │   ├── live-metrics.tsx     # Hiển thị thông số theo thời gian thực
│   │   │   │   │   └── page.tsx             # Trang báo cáo
│   │   │   │   ├── servers/
│   │   │   │   │   ├── [id]/page.tsx        # Trang chi tiết một máy chủ
│   │   │   │   │   └── page.tsx             # Trang danh sách máy chủ
│   │   │   │   ├── settings/page.tsx        # Trang cài đặt
│   │   │   │   ├── tickets/page.tsx         # Trang phiếu bảo trì
│   │   │   │   ├── users/page.tsx           # Trang quản lý người dùng
│   │   │   │   └── layout.tsx               # Khung giao diện chung của các trang dashboard
│   │   │   ├── login/page.tsx               # Trang đăng nhập
│   │   │   ├── globals.css                  # Giao diện dùng chung
│   │   │   ├── layout.tsx                   # Khung giao diện gốc của ứng dụng
│   │   │   └── page.tsx                     # Trang chủ
│   │   ├── lib/
│   │   │   ├── api.ts                       # Hàm gọi API tới Backend
│   │   │   ├── auth.ts                      # Xử lý đăng nhập và lưu token phía giao diện
│   │   │   ├── server-api.ts                # Hàm gọi API liên quan máy chủ
│   │   │   └── *-mock.ts                    # Dữ liệu mẫu cho các trang (alerts, dashboard, hardware...)
│   │   └── types/
│   │       ├── hardware.ts                  # Kiểu dữ liệu phần cứng
│   │       ├── index.ts                     # Kiểu dữ liệu chung
│   │       ├── report.ts                    # Kiểu dữ liệu báo cáo
│   │       └── ticket.ts                    # Kiểu dữ liệu phiếu bảo trì
│   ├── next.config.ts                       # Cấu hình Next.js
│   └── package.json                         # Khai báo thư viện Next.js, React, Socket.IO client
│
├── Docs/
│   ├── 01-overview.md                       # Tổng quan hệ thống
│   ├── 02-auth-requirements.md              # Yêu cầu xác thực và phân quyền
│   ├── 03-user-requirements.md              # Yêu cầu quản lý người dùng
│   ├── 04-server-requirements.md            # Yêu cầu quản lý máy chủ
│   ├── 05-metrics-requirements.md           # Yêu cầu thu thập và giám sát số liệu
│   ├── 06-alert-requirements.md             # Yêu cầu cảnh báo
│   ├── 07-audit-logs-requirements.md        # Yêu cầu nhật ký hoạt động
│   ├── 08-non-functional-requirements.md    # Yêu cầu phi chức năng
│   └── ERD.md                               # Sơ đồ thực thể quan hệ của cơ sở dữ liệu
│
├── database.sql                             # Script tạo các bảng users, servers, history, alerts, tickets, maintenance_logs, audit_logs
├── .env                                     # Biến môi trường (JWT_SECRET, API_KEY, thông tin kết nối PostgreSQL, PORT)
├── nest-cli.json                            # Cấu hình NestJS CLI
├── package.json                             # Khai báo thư viện và script của Backend
├── tsconfig.json                            # Cấu hình TypeScript
└── README.md                                # Mô tả dự án và kiến trúc thư mục
```
## ORM-Object Relational Mapping
Cơ chế hoạt động:

Ánh xạ lớp thành bảng: Mỗi lớp Entity đại diện cho một bảng trong cơ sở dữ liệu.

Ánh xạ thuộc tính thành cột: Các thuộc tính của lớp Entity tương ứng với các cột dữ liệu trong bảng.

Ánh xạ khóa chính và khóa ngoại: Xác định định danh của từng bản ghi và liên kết dữ liệu giữa các bảng.

Ánh xạ mối quan hệ: Hỗ trợ các kiểu quan hệ One-to-One (một-một), One-to-Many (một-nhiều), Many-to-One (nhiều-một) và Many-to-Many (nhiều-nhiều).

Thao tác dữ liệu: Hỗ trợ thêm, sửa, xóa và truy vấn dữ liệu thông qua Entity và Repository mà không cần viết toàn bộ câu lệnh SQL thủ công.

Áp dụng trong dự án:

Các Entity như User, Server, Alert, History và AuditLog được ánh xạ tương ứng với các bảng dữ liệu trong PostgreSQL. Thông qua TypeORM, các lớp Service có thể thao tác với dữ liệu bằng Repository, giúp kết nối giữa xử lý nghiệp vụ và cơ sở dữ liệu.

Lợi ích:

Giảm số lượng câu lệnh SQL phải viết thủ công.

Giúp mô hình dữ liệu trong mã nguồn thống nhất với cấu trúc cơ sở dữ liệu.

Quản lý các mối quan hệ giữa các thực thể rõ ràng.

Tăng khả năng bảo trì và mở rộng hệ thống.

Hỗ trợ làm việc với nhiều hệ quản trị cơ sở dữ liệu khác nhau thông qua cấu hình phù hợp.
backend-auth-servers
<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Observability

In production applications, observability is essential for understanding how your system behaves, detecting issues early, and maintaining reliable performance.

[NestJS Observe](https://observe.nestjs.com) automatically instruments your NestJS application, giving you deep visibility into your system with minimal setup:

- **Distributed tracing:** Follow requests across services and understand how they flow through your system.
- **Waterfall analysis:** Visualize request execution and identify slow operations, bottlenecks, and unexpected delays.
- **Performance analysis:** Analyze application performance in real time and quickly pinpoint areas that need optimization.
- **Metrics:** Track key application and infrastructure metrics to understand system health and performance trends.
- **Logging:** Centralize and correlate logs with traces and other telemetry to make debugging easier.
- **Error tracking:** Detect errors quickly and investigate their root causes with the surrounding context.
- **SLA monitoring:** Track service-level objectives and identify when your application is approaching or exceeding defined thresholds.
- **Alarms and alerts:** Set up alerts for critical errors, performance degradation, SLA violations, and other anomalies so your team can react quickly.

To add it to this project:

```bash
$ npm install @nestjs/observe
```

Then follow the [setup guide](https://docs.nestjs.com/observability/overview) - it takes a single import and an app key.

The free plan needs no payment details and covers 300,000 events a month. You can also browse the [live demo](https://www.observe-demo.nestjs.com/dashboard) first - the whole dashboard over a busy service's data, with nothing to install.
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

# Collector Agent – AR-IMMS

Chương trình chạy trên mỗi Server/Node: thu **CPU, RAM, Network, Docker Container** và gửi về Backend **mỗi 5 giây** (`POST /metrics`).
Chỉ dùng Node.js có sẵn (>= 22.18), **không cần `npm install`**. Node 22.18 trở lên chạy được file `.ts` trực tiếp.

## Chạy nhanh

```bash
# 1. Chạy bộ kiểm thử
npm test

# 2. Chạy Agent, gửi dữ liệu về Backend
BACKEND_URL=http://localhost:3000/metrics SERVER_CODE=SRV001 API_KEY=<api-key-cua-server> npm start
```

Trên Windows PowerShell, đặt biến môi trường bằng `$env:` rồi chạy:

```powershell
$env:BACKEND_URL="http://localhost:3000/metrics"
$env:SERVER_CODE="SRV001"
$env:API_KEY="<api-key-cua-server>"
npm.cmd start
```

Trong đó:

- `SERVER_CODE` là mã server **đã được đăng ký** ở Backend.
- `API_KEY` là khóa của server đó, do Backend cấp. **Không đưa khóa thật lên GitHub.**

Khi chạy đúng, mỗi 5 giây Agent in một dòng dạng `seq=N cpu=... ram=... đã gửi=N đang đệm=0`.

Hoặc chạy "Mini Data Center" thử nghiệm (nginx + redis + Agent) bằng `docker compose up --build`. Backend chạy riêng trên máy, Agent trong container gọi tới `http://host.docker.internal:3000/metrics`.

## Cấu hình (biến môi trường)

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `BACKEND_URL` | `http://localhost:3000/metrics` | Nơi gửi (POST JSON) |
| `SERVER_CODE` | (bắt buộc) | Mã server đã đăng ký ở Backend (SRV001, SRV002…) |
| `API_KEY` | (trống) | Gửi trong header `x-api-key` |
| `INTERVAL_MS` | `5000` | Chu kỳ gửi |
| `BUFFER_MAX` | `720` | Số bản đệm tối đa khi mất kết nối (khoảng 1 giờ) |
| `FLUSH_PER_TICK` | `20` | Số bản gửi bù tối đa mỗi chu kỳ sau khi mất kết nối |
| `REQUEST_TIMEOUT_MS` | `4000` | Quá thời gian thì tính là lỗi |
| `DOCKER_SOCKET` | `/var/run/docker.sock` | Socket Docker; không có thì bỏ qua phần Container |
| `TLS_CERT_FILE`, `TLS_KEY_FILE`, `TLS_CA_FILE` | (trống) | Bật mTLS khi `BACKEND_URL` là https |

## Định dạng gửi (theo tài liệu API của nhóm)

`POST /metrics`, header `x-api-key`, `Content-Type: application/json`, Backend trả `201`.

```json
{
  "serverCode": "SRV001", "cpuUsage": 45.5, "ramUsage": 62.3,
  "networkIn": 1048576, "networkOut": 524288,
  "docker": [{ "name": "nginx", "status": "running", "cpuPercent": 1.2, "memMb": 120 }],
  "recordedAt": "2026-10-20T08:00:00Z"
}
```

- `networkIn` / `networkOut`: tổng byte/giây của mọi card mạng thật (bỏ loopback và card ảo của Docker).
- `docker.status`: trạng thái Docker (`running`, `exited`…). Không có Docker thì gửi `[]`.
- `recordedAt`: thời điểm thu thập (UTC, ISO 8601). Khi gửi bù, Backend dùng giá trị này, không dùng giờ nhận.

## Gửi lại khi lỗi

- Mất kết nối, Backend lỗi 5xx, **401** (sai API key) hoặc **404** (`SERVER_CODE` chưa đăng ký): Agent vẫn thu và đệm (tối đa `BUFFER_MAX`, đầy thì bỏ bản cũ nhất). Khi hết lỗi, gửi bù **từ cũ đến mới**, mỗi bản giữ `recordedAt` lúc thu thập.
- **400** (dữ liệu sai định dạng): bỏ bản đó để không kẹt hàng đợi.

## Quyết định thiết kế

| Vấn đề | Quyết định | Lý do |
|---|---|---|
| Đường dẫn, xác thực | `POST /metrics`, header `x-api-key`, trả 201 | Theo tài liệu API của nhóm |
| Mã server | Mỗi Agent dùng 1 `SERVER_CODE` đã đăng ký | Server phải đăng ký trước khi gửi dữ liệu |
| mTLS | Bản demo dùng API key. mTLS có sẵn trong Agent, bật khi Backend chuyển sang https | Backend hiện chưa hỗ trợ mTLS |
| Thời gian | Agent gửi `recordedAt` lúc thu thập, kể cả khi gửi bù | Backend dùng `recordedAt` nếu có, bỏ trống mới lấy giờ nhận |
| Mạng | Tổng byte/giây các card mạng thật | Tránh đếm trùng lưu lượng Docker |
| Docker | Gửi cả container đã dừng (`exited`…) | Luật cảnh báo `DOCKER_DOWN` cần thấy container không ở trạng thái `running` |
| 401, 404 | Đệm dữ liệu, ghi log nêu rõ nguyên nhân, sửa xong gửi bù | Tránh mất dữ liệu vì lỗi cấu hình |
| 400 | Bỏ bản đó | Gửi lại cũng vẫn lỗi |
| Gửi bù | Từng bản một, tối đa 20 bản/chu kỳ | Backend chưa có endpoint gửi hàng loạt |
| Chống trùng | Chưa có phía Backend; Agent gửi ít nhất một lần | Có thể bổ sung bỏ qua bản trùng `serverCode` + `recordedAt` |

## Việc còn mở

- **Backend:** tùy chọn bỏ qua bản trùng `serverCode` + `recordedAt`.
- **Cảnh báo (Alerting):** luật "mất dữ liệu quá 90 giây" cần tác vụ chạy định kỳ ở Backend, so `recorded_at` mới nhất của từng server với giờ hiện tại. Luật network cần thêm ngưỡng.
- **Dữ liệu:** bảng `history` chưa lưu thông tin Docker; bảng `alerts` chưa có cột thời gian đóng cảnh báo.
- **Thời gian thực:** Socket.IO chưa có trong tài liệu API, cần thống nhất người phụ trách.

## Đã kiểm thử và giới hạn

- **Backend thật (NestJS + PostgreSQL):** Agent chạy trên Windows, đọc CPU và RAM hợp lý, gửi liên tục mỗi 5 giây; dữ liệu vào bảng `history`. Khi sai API key (401), Agent đệm dữ liệu và ghi log nêu nguyên nhân.
- **mTLS** (kiểm tra với Backend giả, không nằm trong repo): Agent có chứng chỉ client gửi được liên tục; bỏ chứng chỉ thì bị từ chối và dữ liệu được đệm lại. Backend thật chưa bật mTLS.
- **Docker Container:** kiểm tra với Docker Desktop (WSL 2) bằng bản `docker compose` có Backend giả: Agent đọc được 4 container và gửi đúng danh sách trong dữ liệu. Bản compose trong repo (không kèm Backend giả, gọi Backend thật qua `host.docker.internal`) chưa chạy thử. Khi Agent chạy trong container, CPU và RAM là của máy ảo Linux do Docker tạo ra, không phải của máy Windows.
- Linux (đọc `/proc`) là môi trường chính. macOS chưa kiểm tra.
- Chưa có xác thực Agent ngoài mTLS, và chưa quay vòng chứng chỉ.
- Thư mục `certs/` nằm trong `.gitignore`.
## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.






