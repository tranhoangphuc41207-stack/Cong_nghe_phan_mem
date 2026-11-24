---
name: ar-imms-audit-log
description: Cách AuditInterceptor tự ghi nhật ký hoạt động trong AR-IMMS. Dùng khi thêm đối tượng mới cần ghi log hoặc sửa audit-logs.
---

# Audit log

- `AuditInterceptor` tự ghi mọi request **POST/PUT/PATCH/DELETE** thành công, trừ `/auth/*` và `/metrics/*`.
- Tên hành động: `<ĐỘNG TỪ>_<ĐỐI TƯỢNG>[_<PHẦN ĐƯỜNG DẪN>]`, ví dụ `PATCH /servers/1/thresholds` -> `UPDATE_SERVER_THRESHOLDS`.
- Đăng nhập ghi riêng trong `AuthService` (`LOGIN`, `LOGIN_FAILED`).
- Trường mật khẩu bị loại khỏi `details` trước khi ghi.
- Ghi bất đồng bộ (không `await`) để không làm chậm phản hồi.
- Đối tượng mới muốn có tên đẹp trong log: thêm vào `ENTITY_NAMES`.
- Chỉ ADMIN xem được qua `GET /audit-logs`.
