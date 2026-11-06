# nhom-3 CNPM
# Architecture
```bash
ar-imms-backend/
│
├── src/
│   │
│   ├── alerts/
│   │   ├── alert.entity.ts              # Định nghĩa cấu trúc bảng alerts trong PostgreSQL
│   │   ├── alerts.controller.ts         # Tiếp nhận API quản lý cảnh báo
│   │   ├── alerts.module.ts             # Đăng ký và liên kết các thành phần của module cảnh báo
│   │   └── alerts.service.ts             # Xử lý nghiệp vụ tạo, xem và cập nhật cảnh báo
│   │
│   ├── audit-logs/
│   │   ├── audit-log.entity.ts          # Định nghĩa cấu trúc bảng audit_logs trong PostgreSQL
│   │   ├── audit-logs.controller.ts     # Tiếp nhận API xem nhật ký hoạt động
│   │   ├── audit-logs.module.ts         # Đăng ký module nhật ký hoạt động
│   │   ├── audit-logs.service.ts        # Xử lý nghiệp vụ truy xuất nhật ký
│   │   └── audit.interceptor.ts         # Ghi nhận hoạt động của người dùng vào nhật ký
│   │
│   ├── auth/
│   │   ├── dto/
│   │   │   └── login.dto.ts             # Kiểm tra dữ liệu gửi lên khi đăng nhập
│   │   ├── auth.controller.ts           # Tiếp nhận API đăng nhập và xác thực
│   │   ├── auth.module.ts               # Đăng ký module xác thực
│   │   ├── auth.service.ts               # Xử lý đăng nhập, kiểm tra tài khoản và tạo JWT
│   │   ├── jwt-auth.guard.ts             # Bảo vệ API bằng token JWT
│   │   └── jwt.strategy.ts               # Kiểm tra và giải mã JWT
│   │
│   ├── common/
│   │   ├── role.enum.ts                  # Khai báo các vai trò ADMIN, OPERATOR, TECHNICIAN
│   │   ├── roles.decorator.ts            # Khai báo quyền truy cập cho từng API
│   │   └── roles.guard.ts                # Kiểm tra quyền truy cập theo vai trò
│   │
│   ├── metrics/
│   │   ├── dto/
│   │   │   └── create-metric.dto.ts     # Kiểm tra dữ liệu thông số máy chủ gửi lên
│   │   ├── api-key.guard.ts              # Xác thực API Key khi gửi thông số
│   │   ├── history.entity.ts             # Định nghĩa cấu trúc bảng history trong PostgreSQL
│   │   ├── metrics.controller.ts         # Tiếp nhận API gửi và xem thông số máy chủ
│   │   ├── metrics.module.ts             # Đăng ký module quản lý thông số
│   │   └── metrics.service.ts             # Xử lý lưu trữ và truy xuất thông số máy chủ
│   │
│   ├── servers/
│   │   ├── dto/
│   │   │   ├── create-server.dto.ts      # Kiểm tra dữ liệu khi tạo máy chủ
│   │   │   ├── update-server.dto.ts      # Kiểm tra dữ liệu khi cập nhật máy chủ
│   │   │   ├── update-status.dto.ts      # Kiểm tra dữ liệu khi cập nhật trạng thái
│   │   │   └── update-thresholds.dto.ts  # Kiểm tra ngưỡng CPU và RAM
│   │   ├── server-status.enum.ts         # Khai báo các trạng thái máy chủ
│   │   ├── server.entity.ts              # Định nghĩa cấu trúc bảng servers trong PostgreSQL
│   │   ├── servers.controller.ts         # Tiếp nhận API quản lý máy chủ
│   │   ├── servers.module.ts             # Đăng ký module quản lý máy chủ
│   │   └── servers.service.ts             # Xử lý nghiệp vụ thêm, sửa, xóa và truy vấn máy chủ
│   │
│   ├── users/
│   │   ├── dto/
│   │   │   └── update-user-role.dto.ts  # Kiểm tra dữ liệu khi thay đổi vai trò người dùng
│   │   ├── user.entity.ts                # Định nghĩa cấu trúc bảng users trong PostgreSQL
│   │   ├── users.controller.ts           # Tiếp nhận API quản lý người dùng
│   │   ├── users.module.ts               # Đăng ký module quản lý người dùng
│   │   └── users.service.ts               # Xử lý nghiệp vụ quản lý tài khoản
│   │
│   ├── app.controller.ts                 # Tiếp nhận các API chung của ứng dụng
│   ├── app.controller.spec.ts             # Kiểm thử AppController
│   ├── app.module.ts                      # Module gốc, cấu hình PostgreSQL và liên kết các module
│   ├── app.service.ts                      # Xử lý nghiệp vụ chung của ứng dụng
│   └── main.ts                            # Điểm khởi chạy, cấu hình CORS, validation và Swagger
│
├── test/
│   ├── app.e2e-spec.ts                    # Kiểm thử hoạt động API theo luồng thực tế
│   └── jest-e2e.json                      # Cấu hình kiểm thử End-to-End
│
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






