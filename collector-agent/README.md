# Collector Agent – AR-IMMS (Collector Agent và Telemetry)

Chương trình chạy trên mỗi Server/Node: thu CPU, RAM, Network, Docker Container và gửi về Backend **mỗi 5 giây**.
Chỉ dùng Node.js có sẵn (>= 22.18), không cần `npm install`.

## Chạy nhanh

```bash
npm test                 # 13 test

# Với Backend thật của Bảo:
BACKEND_URL=http://<IP>:3000/metrics SERVER_CODE=SRV001 API_KEY=<key Bảo cấp> npm start
```

Hoặc cả "Mini Data Center" thử nghiệm: `docker compose up --build` (nginx + redis + Agent, Backend thật chạy riêng trên máy).

## Cấu hình (biến môi trường)

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `BACKEND_URL` | `http://localhost:3000/metrics` | Nơi gửi (POST JSON), theo API của Bảo |
| `SERVER_CODE` | (bắt buộc) | Mã server đã đăng ký ở Backend (SRV001, SRV002…) |
| `API_KEY` | (trống) | Gửi trong header `x-api-key` |
| `INTERVAL_MS` | `5000` | Chu kỳ gửi |
| `BUFFER_MAX` | `720` | Số bản đệm tối đa khi mất kết nối (khoảng 1 giờ) |
| `FLUSH_PER_TICK` | `20` | Số bản gửi bù tối đa mỗi chu kỳ sau khi mất kết nối |
| `REQUEST_TIMEOUT_MS` | `4000` | Quá thời gian thì tính là lỗi |
| `DOCKER_SOCKET` | `/var/run/docker.sock` | Socket Docker; không có thì bỏ qua phần Container |
| `TLS_CERT_FILE`, `TLS_KEY_FILE`, `TLS_CA_FILE` | (trống) | Bật mTLS khi `BACKEND_URL` là https |

## mTLS (tùy chọn, Backend hiện chưa bật)

```bash
npm run certs            # tạo certs/ (CA, server, agent) CHỈ để thử
BACKEND_URL=https://localhost:3000/metrics SERVER_CODE=SRV001 API_KEY=test-key TLS_CERT_FILE=certs/agent.crt TLS_KEY_FILE=certs/agent.key TLS_CA_FILE=certs/ca.crt npm start
```

Agent không có chứng chỉ client sẽ bị Backend từ chối. Thư mục `certs/` nằm trong `.gitignore`, không đưa khóa lên GitHub.

## Gửi lại khi lỗi

- Mất kết nối, Backend lỗi 5xx, **401 (sai API key)** hoặc **404 (SERVER_CODE chưa đăng ký)**: Agent vẫn thu và đệm (tối đa `BUFFER_MAX`, đầy thì bỏ bản cũ nhất). Khi hết lỗi, gửi bù **từ cũ đến mới**, mỗi bản giữ `recordedAt` lúc thu thập.
- **400** (dữ liệu sai định dạng): bỏ bản đó để không kẹt hàng đợi.

## Định dạng gửi (theo API.docx của Bảo)

`POST /metrics`, header `x-api-key`, `Content-Type: application/json`, trả 201.

```json
{
  "serverCode": "SRV001", "cpuUsage": 45.5, "ramUsage": 62.3,
  "networkIn": 1048576, "networkOut": 524288,
  "docker": [{ "name": "nginx", "status": "running", "cpuPercent": 1.2, "memMb": 120 }],
  "recordedAt": "2026-10-20T08:00:00Z"
}
```

- `networkIn/Out`: tổng byte/giây của mọi card mạng (trừ loopback).
- `docker.status`: trạng thái Docker (running, exited…). Không có Docker thì gửi `[]`.
- `recordedAt`: thời điểm thu thập. Khi gửi bù, Backend phải dùng giá trị này, không dùng giờ nhận.

## Thống nhất theo API.docx của Bảo (Người 1)

API.docx là chuẩn. Agent làm theo nó, không đòi Backend sửa. Các quyết định:

| Vấn đề | Quyết định | Lý do |
|---|---|---|
| Đường dẫn, xác thực | `POST /metrics`, header `x-api-key`, trả 201 | Theo API.docx |
| Mã server | Mỗi Agent dùng 1 `SERVER_CODE` đã đăng ký (SRV001, SRV002). Cần mã mới thì báo Bảo thêm | API.docx: "Server phải đăng ký trước" |
| mTLS | Bản demo dùng API key. mTLS đã có sẵn trong Agent, bật khi Backend chuyển sang https | Backend chưa hỗ trợ mTLS |
| Thời gian | Agent gửi `recordedAt` (UTC, ISO 8601) lúc thu thập, kể cả khi gửi bù | API.docx: có `recordedAt` thì Backend dùng, bỏ trống mới lấy giờ nhận |
| Mạng | `networkIn/Out` = tổng byte/giây các card mạng thật (bỏ lo, docker0, veth*, br-*) | Tránh đếm trùng lưu lượng Docker |
| Docker | Gửi cả container đã dừng (`status` là `exited`...) | Luật DOCKER_DOWN của Alerting cần thấy container không ở trạng thái running |
| Sai API key (401), server chưa đăng ký (404) | Đệm dữ liệu, ghi log nêu rõ nguyên nhân, sửa xong gửi bù | Tránh mất dữ liệu vì lỗi cấu hình |
| Dữ liệu sai (400) | Bỏ bản đó | Gửi lại cũng vẫn lỗi |
| Gửi bù | Từng bản một, tối đa 20 bản/chu kỳ (`FLUSH_PER_TICK`) | Backend chưa có endpoint gửi hàng loạt |
| Chống trùng | Chưa có phía Backend. Agent gửi ít nhất một lần, hiếm khi trùng nếu timeout đúng lúc Backend đã lưu | Chờ Bảo xử lý (không bắt buộc) |

## Việc còn mở (không chặn nhau)

- **Bảo:** cấp `API_KEY` thật và IP/cổng truy cập được từ máy chạy Agent; tùy chọn bỏ qua bản trùng `serverCode` + `recordedAt`.
- **Khánh:** luật "mất dữ liệu quá 90 giây" cần tác vụ chạy định kỳ ở Backend so `recorded_at` mới nhất của từng server với giờ hiện tại. Luật network cần thêm ngưỡng, hiện chưa có.
- Bảng `history` chưa lưu Docker; bảng `alerts` chưa có cột thời gian đóng cảnh báo.
- Socket.IO thời gian thực chưa thấy trong API.docx; cần chốt ai làm.

## Giới hạn hiện tại

- Chạy trên Linux (đọc `/proc`). Windows/macOS chưa hỗ trợ.
- Chưa thử với Docker thật (môi trường dựng code không có Docker); phần Container đã kiểm tra bằng socket giả lập. Nhóm nên chạy `docker compose up --build` trên máy có Docker để xác nhận.
- Chưa có xác thực agent ngoài mTLS, và chưa quay vòng chứng chỉ.
