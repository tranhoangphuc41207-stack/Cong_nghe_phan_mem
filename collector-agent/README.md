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
