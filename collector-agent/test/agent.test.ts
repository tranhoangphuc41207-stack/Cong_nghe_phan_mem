import { test } from 'node:test';
import assert from 'node:assert/strict';
import { RingBuffer } from '../src/buffer.ts';
import { cpuPercent, readMemory, readNetCounters, readCpuTimes } from '../src/collectors/system.ts';
import { calcContainerCpu } from '../src/collectors/docker.ts';
import { Sender } from '../src/sender.ts';
import { loadConfig } from '../src/config.ts';
import type { Telemetry } from '../src/types.ts';

const tel = (seq: number): Telemetry => ({
  agentId: 'a', hostname: 'h', seq, timestamp: new Date(seq * 1000).toISOString(), intervalMs: 5000,
  cpu: { usagePercent: 1, cores: 1, load1: 0 }, memory: { totalBytes: 1, usedBytes: 1, usagePercent: 1 },
  network: [], docker: { available: false, containers: [] },
});

test('mặc định gửi mỗi 5 giây', () => {
  assert.equal(loadConfig({}).intervalMs, 5000);
  assert.equal(loadConfig({ INTERVAL_MS: 'abc' }).intervalMs, 5000);
  assert.equal(loadConfig({ INTERVAL_MS: '1000' }).intervalMs, 1000);
});

test('RingBuffer bỏ bản cũ nhất khi đầy', () => {
  const b = new RingBuffer<number>(3);
  [1, 2, 3, 4, 5].forEach((n) => b.push(n));
  assert.equal(b.length, 3);
  assert.equal(b.peek(), 3);
  assert.equal(b.dropped, 2);
});

test('tính CPU % từ /proc/stat', () => {
  const a = readCpuTimes('cpu  100 0 100 800 0 0 0 0\n');
  const b = readCpuTimes('cpu  200 0 200 900 0 0 0 0\n');
  assert.equal(cpuPercent(a, b), 66.67); // 200 bận / 300 tổng
});

test('đọc RAM dùng MemAvailable', () => {
  const m = readMemory('MemTotal:       1000 kB\nMemAvailable:    250 kB\n');
  assert.equal(m.totalBytes, 1000 * 1024);
  assert.equal(m.usagePercent, 75);
});

test('đọc bộ đếm mạng, bỏ loopback', () => {
  const txt = 'h1\nh2\n    lo: 10 0 0 0 0 0 0 0 20 0 0 0 0 0 0 0\n  eth0: 1000 5 0 0 0 0 0 0 2000 4 0 0 0 0 0 0\n';
  const m = readNetCounters(txt);
  assert.deepEqual([...m.keys()], ['eth0']);
  assert.deepEqual(m.get('eth0'), { rx: 1000, tx: 2000 });
});

test('CPU của Container', () => {
  const s = { cpu_stats: { cpu_usage: { total_usage: 300 }, system_cpu_usage: 2000, online_cpus: 2 },
              precpu_stats: { cpu_usage: { total_usage: 100 }, system_cpu_usage: 1000 } };
  assert.equal(calcContainerCpu(s), 40); // 200/1000 * 2 * 100
});

test('mất kết nối thì đệm, có lại thì gửi bù đúng thứ tự, không mất bản nào', async () => {
  const got: number[] = [];
  let online = false;
  const s = new Sender(async (body) => {
    if (!online) throw new Error('ECONNREFUSED');
    got.push(JSON.parse(body).seq);
  }, 100);
  await s.enqueueAndFlush(tel(1));
  await s.enqueueAndFlush(tel(2));
  assert.equal(s.buffer.length, 2);
  online = true;
  await s.enqueueAndFlush(tel(3));
  assert.deepEqual(got, [1, 2, 3]);
  assert.equal(s.buffer.length, 0);
});

test('Backend từ chối (4xx) thì bỏ bản đó, không kẹt hàng đợi', async () => {
  const got: number[] = [];
  const s = new Sender(async (body) => {
    const t = JSON.parse(body);
    if (t.seq === 1) { const e: any = new Error('HTTP 400'); e.permanent = true; throw e; }
    got.push(t.seq);
  }, 100);
  await s.enqueueAndFlush(tel(1));
  await s.enqueueAndFlush(tel(2));
  assert.deepEqual(got, [2]);
  assert.equal(s.buffer.length, 0);
});

import http from 'node:http';
import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { collectDocker } from '../src/collectors/docker.ts';

test('thu Container qua socket Docker (giả lập), và báo available=false khi không có Docker', async () => {
  const sock = process.platform === 'win32'
  ? `\\\\.\\pipe\\fake-docker-${process.pid}`
  : path.join(os.tmpdir(), `fake-docker-${process.pid}.sock`);
  const srv = http.createServer((req, res) => {
    res.setHeader('content-type', 'application/json');
    if (req.url!.startsWith('/containers/json')) {
      return res.end(JSON.stringify([
        { Id: 'aaaaaaaaaaaaaaaa', Names: ['/web-demo'], Image: 'nginx', State: 'running' },
        { Id: 'bbbbbbbbbbbbbbbb', Names: ['/old'], Image: 'redis', State: 'exited' },
      ]));
    }
    res.end(JSON.stringify({
      cpu_stats: { cpu_usage: { total_usage: 300 }, system_cpu_usage: 2000, online_cpus: 2 },
      precpu_stats: { cpu_usage: { total_usage: 100 }, system_cpu_usage: 1000 },
      memory_stats: { usage: 5000, limit: 10000, stats: { inactive_file: 1000 } },
    }));
  });
  await new Promise<void>((r) => srv.listen(sock, r));
  try {
    const d = await collectDocker(sock);
    assert.equal(d.available, true);
    assert.equal(d.containers.length, 2);
    assert.deepEqual(d.containers[0], { id: 'aaaaaaaaaaaa', name: 'web-demo', image: 'nginx', state: 'running', cpuPercent: 40, memUsageBytes: 4000, memLimitBytes: 10000 });
    assert.equal(d.containers[1].cpuPercent, null);
    const none = await collectDocker('/tmp/khong-ton-tai.sock');
    assert.deepEqual(none, { available: false, containers: [] });
  } finally {
      await new Promise<void>((resolve) => srv.close(() => resolve()));

  if (process.platform !== 'win32') {
    fs.rmSync(sock, { force: true });
  }
  }
});

import { toBackendPayload } from '../src/payload.ts';
import { makePost } from '../src/sender.ts';

test('đổi sang đúng định dạng Backend (POST /metrics)', () => {
  const t = tel(1);
  t.cpu.usagePercent = 45.5;
  t.memory.usagePercent = 62.3;
  t.network = [{ iface: 'eth0', rxBytesPerSec: 1000, txBytesPerSec: 500 }, { iface: 'eth1', rxBytesPerSec: 48, txBytesPerSec: 24 }];
  t.docker = { available: true, containers: [
    { id: 'a', name: 'nginx', image: 'nginx', state: 'running', cpuPercent: 1.2, memUsageBytes: 125829120, memLimitBytes: null },
    { id: 'b', name: 'mysql', image: 'mysql', state: 'exited', cpuPercent: null, memUsageBytes: null, memLimitBytes: null },
  ] };
  assert.deepEqual(toBackendPayload(t, 'SRV001'), {
    serverCode: 'SRV001', cpuUsage: 45.5, ramUsage: 62.3, networkIn: 1048, networkOut: 524,
    docker: [{ name: 'nginx', status: 'running', cpuPercent: 1.2, memMb: 120 }, { name: 'mysql', status: 'exited', cpuPercent: 0, memMb: 0 }],
    recordedAt: t.timestamp,
  });
});

test('gửi kèm header x-api-key; 401/404 không bị coi là lỗi vĩnh viễn, 400 thì có', async () => {
  let status = 201; let lastKey: string | undefined;
  const srv = http.createServer((req, res) => { lastKey = req.headers['x-api-key'] as string; req.resume(); req.on('end', () => { res.writeHead(status); res.end('{}'); }); });
  await new Promise<void>((r) => srv.listen(0, r));
  const port = (srv.address() as any).port;
  const cfg = { ...loadConfig({}), backendUrl: `http://127.0.0.1:${port}/metrics`, apiKey: 'abc' };
  const post = makePost(cfg);
  try {
    await post('{}');
    assert.equal(lastKey, 'abc');
    status = 409; await post('{}'); // bản trùng: coi như thành công
    for (const [code, permanent] of [[401, false], [404, false], [500, false], [400, true]] as const) {
      status = code;
      await assert.rejects(post('{}'), (e: any) => e.permanent === permanent && e.message.startsWith(`HTTP ${code}`));
    }
  } finally { srv.close(); }
});

test('gửi bù có giới hạn mỗi chu kỳ, không dồn hết một lúc', async () => {
  let online = false; const got: number[] = [];
  const s = new Sender(async (b) => { if (!online) throw new Error('x'); got.push(JSON.parse(b).seq); }, 100, () => {}, (t) => JSON.stringify(t), 3);
  for (let i = 1; i <= 5; i++) await s.enqueueAndFlush(tel(i));
  online = true;
  await s.enqueueAndFlush(tel(6)); // 6 bản đang đệm, chỉ gửi 3
  assert.deepEqual(got, [1, 2, 3]);
  await s.enqueueAndFlush(tel(7));
  assert.deepEqual(got, [1, 2, 3, 4, 5, 6]);
});

test('bỏ card ảo Docker khi tính mạng', () => {
  const txt = 'h\nh\n docker0: 1 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0\n veth12ab: 1 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0\n br-ab12: 1 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0\n  eth0: 5 0 0 0 0 0 0 0 6 0 0 0 0 0 0 0\n';
  assert.deepEqual([...readNetCounters(txt).keys()], ['eth0']);
});
