import os from 'node:os';
import { loadConfig } from './config.ts';
import { SystemCollector } from './collectors/system.ts';
import { collectDocker } from './collectors/docker.ts';
import { Sender, makePost } from './sender.ts';
import { toBackendPayload } from './payload.ts';
import type { Telemetry } from './types.ts';

const cfg = loadConfig();
if (!cfg.serverCode) {
  console.error('Thiếu SERVER_CODE (mã server đã đăng ký ở Backend, vd SRV001).');
  process.exit(1);
}
const hostname = os.hostname();
const agentId = cfg.agentId || cfg.serverCode;
const log = (m: string) => console.log(`[${new Date().toISOString()}] ${m}`);

const system = new SystemCollector();
const sender = new Sender(makePost(cfg), cfg.bufferMax, log, (t) => JSON.stringify(toBackendPayload(t, cfg.serverCode)), cfg.flushPerTick);
let seq = 0;
let stopping = false;
let timer: NodeJS.Timeout | undefined;

async function tick(): Promise<void> {
  const started = Date.now();
  try {
    const [sys, docker] = await Promise.all([Promise.resolve(system.collect()), collectDocker(cfg.dockerSocket)]);
    const t: Telemetry = {
      agentId,
      hostname,
      seq: ++seq,
      timestamp: new Date().toISOString(),
      intervalMs: cfg.intervalMs,
      ...sys,
      docker,
    };
    await sender.enqueueAndFlush(t);
    log(`seq=${t.seq} cpu=${t.cpu.usagePercent}% ram=${t.memory.usagePercent}% containers=${docker.containers.length} đã gửi=${sender.sent} đang đệm=${sender.buffer.length}`);
  } catch (e: any) {
    log(`Lỗi chu kỳ: ${e?.message}`);
  }
  if (!stopping) timer = setTimeout(tick, Math.max(cfg.intervalMs - (Date.now() - started), 0));
}

function shutdown(sig: string) {
  stopping = true;
  if (timer) clearTimeout(timer);
  log(`Nhận ${sig}, dừng Agent (còn ${sender.buffer.length} bản chưa gửi)`);
  process.exit(0);
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

log(`Collector Agent khởi động: id=${agentId} → ${cfg.backendUrl} mỗi ${cfg.intervalMs}ms`);
tick();
