---
name: ar-imms-collector-agent
description: Hướng dẫn Collector Agent của AR-IMMS (Node.js thuần, chạy file .ts trực tiếp) - thu CPU/RAM/Network/Docker, gửi POST /metrics bằng API key (hỗ trợ mTLS), bộ đệm gửi bù khi mất kết nối. Dùng khi sửa hoặc chạy Agent trong `collector-agent/`.
---

# Collector Agent (thư mục `collector-agent/`)

Chương trình chạy trên mỗi máy chủ được giám sát: thu số liệu rồi gửi về Backend `POST /metrics` mỗi **5 giây**.
Chỉ dùng Node.js có sẵn (>= 22.18, chạy `.ts` trực tiếp), **không cần `npm install`**.

## Chạy

```bash
cd collector-agent
npm test
BACKEND_URL=http://localhost:3000/metrics SERVER_CODE=SRV001 API_KEY=<api-key> npm start
```

Thử nhanh với Docker: `docker compose up --build` (có 2 container mẫu `web-demo`, `cache-demo` và Agent; Agent mount `docker.sock` chỉ đọc).
Không đưa API key thật lên GitHub.

## Biến môi trường (`src/config.ts`)

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `SERVER_CODE` | bắt buộc | Mã máy chủ đã đăng ký ở Backend (vd `SRV001`); thiếu thì Agent thoát |
| `API_KEY` | rỗng | Gửi trong header `x-api-key`, phải khớp `API_KEY` của Backend |
| `BACKEND_URL` | `http://localhost:3000/metrics` | Địa chỉ nhận telemetry |
| `INTERVAL_MS` | 5000 | Chu kỳ thu thập |
| `BUFFER_MAX` | 720 | Số bản tối đa trong bộ đệm (720 x 5s = 1 giờ) |
| `FLUSH_PER_TICK` | 20 | Số bản gửi bù tối đa mỗi chu kỳ |
| `REQUEST_TIMEOUT_MS` | 4000 | Timeout mỗi request |
| `DOCKER_SOCKET` | `/var/run/docker.sock` | Socket Docker Engine |
| `TLS_CERT_FILE`, `TLS_KEY_FILE`, `TLS_CA_FILE` | không | Bật mTLS khi `BACKEND_URL` là https |

## Cấu trúc và luồng chạy

- `index.ts`: mỗi chu kỳ gọi `tick()` -> thu số liệu -> `sender.enqueueAndFlush()`; xử lý SIGINT/SIGTERM.
- `collectors/system.ts`: CPU tính từ `/proc/stat` (dự phòng `os.cpus()`), RAM từ `/proc/meminfo`, tốc độ mạng theo byte/giây.
- `collectors/docker.ts`: gọi Docker Engine API qua unix socket; không có Docker thì trả `available: false`, không làm Agent lỗi.
- `payload.ts`: đổi dữ liệu nội bộ sang định dạng Backend (`serverCode`, `cpuUsage`, `ramUsage`, `networkIn`, `networkOut`, `docker[]`, `recordedAt`); CPU/RAM kẹp trong 0-100, network cộng tất cả card mạng.
- `sender.ts`: gửi POST JSON, hỗ trợ mTLS, xử lý kết quả và gửi bù.
- `buffer.ts`: `RingBuffer`, đầy thì bỏ bản cũ nhất.

## Cơ chế gửi bù (quan trọng khi vấn đáp)

Mỗi chu kỳ bản mới được đưa vào bộ đệm, rồi gửi từ **cũ đến mới**, tối đa `FLUSH_PER_TICK` bản:

- 2xx -> thành công, bỏ khỏi bộ đệm.
- 400/422 -> dữ liệu sai định dạng, gửi lại vô ích nên **bỏ bản đó**.
- 401 (sai API key), 404 (`SERVER_CODE` chưa đăng ký), lỗi mạng, timeout -> **giữ lại** trong bộ đệm, dừng lượt gửi, sửa xong sẽ gửi bù.
- 409 được coi như đã gửi xong (ghi chú trong code: bản trùng đã lưu). Hiện `MetricsService.ingest` ở Backend chưa kiểm tra trùng và chưa trả 409.

Liên hệ với Backend: nếu Agent im quá 90 giây, Backend đặt máy chủ `OFFLINE` và tạo cảnh báo `NO_TELEMETRY`; khi Agent gửi lại thì cảnh báo tự được giải quyết.
