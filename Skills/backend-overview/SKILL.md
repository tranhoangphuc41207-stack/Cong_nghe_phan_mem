---
name: ar-imms-backend-overview
description: Tổng quan backend AR-IMMS (NestJS + TypeORM + PostgreSQL) - cách chạy, database, cấu trúc module, quy ước code. Dùng khi thêm/sửa API hoặc module mới.
---

# AR-IMMS Backend - Tổng quan

Hệ thống giám sát hạ tầng máy chủ (môn Công nghệ phần mềm, nhóm 3). Gồm backend NestJS (`src/`), web Next.js (`web/`), Collector Agent (`collector-agent/`). Skill này chỉ nói về backend.

## Công nghệ

- NestJS 12, TypeScript, TypeORM, PostgreSQL (`pg`)
- JWT (`passport-jwt`), `bcrypt`, Socket.IO, `class-validator` với `ValidationPipe({ whitelist: true })`
- Swagger tại `/api`

## Chạy dự án

```bash
npm install
npm run start:dev     # chạy có watch, mặc định cổng 3000
npm run lint
npm run test
npm run test:e2e
```

Biến trong `.env`: `PORT`, `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, `JWT_SECRET`, `API_KEY`. Thiếu `JWT_SECRET` hoặc `API_KEY` thì app báo lỗi ngay khi khởi động. Không commit giá trị thật.

## Cơ sở dữ liệu

- `synchronize: false`: không tự tạo bảng. Đổi cấu trúc bảng phải sửa `database.sql` và sửa Entity cho khớp.
- Bảng: `users`, `servers`, `history`, `alerts`, `tickets`, `maintenance_logs`, `audit_logs` (xem `Docs/ERD.md`).
- Entity dùng `autoLoadEntities: true`, chỉ cần `TypeOrmModule.forFeature([...])` trong module.

## Các module

| Module | Việc chính |
|---|---|
| `auth` | Đăng nhập, cấp JWT, `GET /auth/me` |
| `users` | CRUD tài khoản, kích hoạt/vô hiệu hóa, đổi vai trò (ADMIN) |
| `servers` | Quản lý máy chủ, ngưỡng CPU/RAM, trạng thái, bảo hành sắp hết hạn |
| `metrics` | Nhận telemetry, lịch sử, số liệu mới nhất, phát hiện Offline |
| `alerts` | Cảnh báo, đẩy realtime qua `AlertsGateway` |
| `audit-logs` | Xem nhật ký (ADMIN), `AuditInterceptor` tự ghi |
| `tickets` | Mới có Entity và enum, chưa có controller/service |
| `common` | `Role` enum, `@Roles()`, `RolesGuard` |

## Quy ước khi viết code

- Controller mỏng, nghiệp vụ nằm trong service.
- Dữ liệu gửi lên phải có DTO; vì `whitelist: true`, field không khai báo sẽ bị bỏ.
- Route cố định khai báo **trước** route có tham số (`GET /metrics/latest` trước `GET /metrics/:serverId`; `GET /servers/warranty/expiring` trước `GET /servers/:id`).
- Tham số số dùng `ParseIntPipe`.
- PostgreSQL có thể trả `numeric`/`bigint` dạng chuỗi, cần `Number()` khi dùng raw query.
- Thông báo lỗi cho người dùng viết bằng tiếng Việt.
- Thêm module mới: Entity -> bảng trong `database.sql` -> module/service/controller -> import vào `AppModule`.

## Còn dang dở

- `tickets` chưa có controller và service.
- Web còn dùng dữ liệu mẫu ở `web/src/lib/*-mock.ts` cho một số trang.
