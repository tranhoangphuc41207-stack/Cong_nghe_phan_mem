import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import { RingBuffer } from './buffer.ts';
import type { Config } from './config.ts';
import type { Telemetry } from './types.ts';

export type PostFn = (body: string) => Promise<void>;

// Tạo hàm POST JSON. Nếu URL là https và có cert/key/ca thì dùng mTLS.
export function makePost(cfg: Config): PostFn {
  const url = new URL(cfg.backendUrl);
  const isHttps = url.protocol === 'https:';
  const agent = isHttps
    ? new https.Agent({
        keepAlive: true,
        cert: cfg.tls.certFile ? fs.readFileSync(cfg.tls.certFile) : undefined,
        key: cfg.tls.keyFile ? fs.readFileSync(cfg.tls.keyFile) : undefined,
        ca: cfg.tls.caFile ? fs.readFileSync(cfg.tls.caFile) : undefined,
        rejectUnauthorized: true, // luôn kiểm tra chứng chỉ của Backend
      })
    : undefined;
  const lib = isHttps ? https : http;

  return (body: string) =>
    new Promise<void>((resolve, reject) => {
      const req = lib.request(
        url,
        {
          method: 'POST',
          agent,
          timeout: cfg.requestTimeoutMs,
          headers: {
            'content-type': 'application/json',
            'content-length': Buffer.byteLength(body),
            ...(cfg.apiKey ? { 'x-api-key': cfg.apiKey } : {}),
          },
        },
        (res) => {
          res.resume();
          res.on('end', () => {
            const code = res.statusCode ?? 0;
            // 2xx (Backend trả 201) = thành công.
            // 400 = dữ liệu sai định dạng, gửi lại cũng vô ích nên bỏ bản đó.
            // 401 (sai API key) và 404 (SERVER_CODE chưa đăng ký) là lỗi cấu hình: vẫn đệm để
            // không mất dữ liệu, sửa xong sẽ gửi bù.
            // 409 = Backend báo bản này đã lưu rồi (trùng serverCode + recordedAt): coi như đã gửi xong.
            if ((code >= 200 && code < 300) || code === 409) return resolve();
            const hint = code === 401 ? ' - kiểm tra API_KEY' : code === 404 ? ' - SERVER_CODE chưa đăng ký ở Backend' : '';
            const err: any = new Error(`HTTP ${code}${hint}`);
            err.permanent = code === 400 || code === 422;
            reject(err);
          });
        },
      );
      req.on('timeout', () => req.destroy(new Error('timeout')));
      req.on('error', reject);
      req.end(body);
    });
}

export class Sender {
  readonly buffer: RingBuffer<Telemetry>;
  sent = 0;
  private readonly post: PostFn;
  private readonly log: (m: string) => void;
  private readonly serialize: (t: Telemetry) => string;
  private readonly flushPerTick: number;
  constructor(post: PostFn, bufferMax: number, log: (m: string) => void = () => {}, serialize: (t: Telemetry) => string = (t) => JSON.stringify(t), flushPerTick = Infinity) {
    this.flushPerTick = flushPerTick;
    this.post = post;
    this.log = log;
    this.serialize = serialize;
    this.buffer = new RingBuffer<Telemetry>(bufferMax);
  }

  // Đưa bản mới vào hàng đợi rồi gửi bù theo thứ tự từ cũ đến mới.
  // Gặp lỗi mạng thì dừng, giữ lại phần còn lại cho lần sau.
  async enqueueAndFlush(t: Telemetry): Promise<void> {
    this.buffer.push(t);
    let budget = this.flushPerTick;
    while (this.buffer.length > 0 && budget-- > 0) {
      const next = this.buffer.peek()!;
      try {
        await this.post(this.serialize(next));
        this.buffer.shift();
        this.sent++;
      } catch (e: any) {
        if (e?.permanent) {
          this.log(`Bỏ bản seq=${next.seq}: Backend từ chối (${e.message})`);
          this.buffer.shift();
          continue;
        }
        this.log(`Gửi lỗi (${e?.message}), đang đệm ${this.buffer.length} bản`);
        return;
      }
    }
  }
}
