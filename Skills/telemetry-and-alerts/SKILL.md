---
name: ar-imms-telemetry-and-alerts
description: Luồng nhận telemetry từ Collector Agent, phát hiện Offline và cảnh báo realtime (Socket.IO) trong AR-IMMS. Dùng khi sửa metrics, ngưỡng hoặc alerts.
---

# Telemetry và cảnh báo

## `POST /metrics` (`MetricsService.ingest`)

1. Tìm máy chủ theo `serverCode` (không có -> 404)
2. Lưu một dòng vào `history` (CPU, RAM, network in/out, Docker, `recordedAt`)
3. Giải quyết cảnh báo `NO_TELEMETRY` đang hoạt động (máy đã gửi lại)
4. Gọi `AlertsService.evaluate()` so với ngưỡng
5. Cập nhật trạng thái máy chủ: có vi phạm -> `WARNING`, không -> `ONLINE`

## Phát hiện Offline

`onModuleInit` đặt timer chạy mỗi **5 giây**. Máy chủ không gửi telemetry quá **90 giây** -> `OFFLINE` và tạo cảnh báo `NO_TELEMETRY`. Cờ `isCheckingOfflineServers` chống chạy chồng; `onModuleDestroy` dừng timer.

## Cảnh báo (`AlertsService.evaluate`)

Loại: `HIGH_CPU`, `HIGH_RAM`, `HIGH_NETWORK`, `DOCKER_DOWN`, `NO_TELEMETRY`.
Trạng thái: `OPEN` -> `ACKNOWLEDGED` -> `RESOLVED`; hai trạng thái đầu là "đang hoạt động".

- Vượt ngưỡng, chưa có cảnh báo cùng loại đang hoạt động -> tạo mới + `emitNew`
- Đã có -> chỉ cập nhật severity/message nếu đổi (không tạo trùng) + `emitUpdated`
- Hết vượt ngưỡng -> `RESOLVED` + `emitResolved`
- CPU/RAM: `CRITICAL` khi >= 95%, còn lại `WARNING`; ngưỡng lưu theo từng máy chủ
- Network: so `networkIn + networkOut` (B/s) với ngưỡng warning/critical của máy chủ; không có dữ liệu thì bỏ qua

`AlertsGateway` (Socket.IO) xác thực JWT khi client kết nối.
