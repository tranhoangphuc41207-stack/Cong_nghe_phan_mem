import os from 'node:os';
import fs from 'node:fs';
import type { NetworkSample } from '../types.ts';

interface CpuTimes { idle: number; total: number }

// Đọc tổng thời gian CPU. Ưu tiên /proc/stat (Linux), dự phòng os.cpus().
export function readCpuTimes(procStat?: string): CpuTimes {
  try {
    const text = procStat ?? fs.readFileSync('/proc/stat', 'utf8');
    const line = text.split('\n').find((l) => l.startsWith('cpu '));
    if (line) {
      const v = line.trim().split(/\s+/).slice(1).map(Number);
      const idle = (v[3] ?? 0) + (v[4] ?? 0); // idle + iowait
      const total = v.slice(0, 8).reduce((a, b) => a + b, 0);
      return { idle, total };
    }
  } catch { /* dùng dự phòng */ }
  let idle = 0, total = 0;
  for (const c of os.cpus()) {
    const t = c.times;
    idle += t.idle;
    total += t.user + t.nice + t.sys + t.idle + t.irq;
  }
  return { idle, total };
}

export function cpuPercent(prev: CpuTimes, cur: CpuTimes): number {
  const dTotal = cur.total - prev.total;
  const dIdle = cur.idle - prev.idle;
  if (dTotal <= 0) return 0;
  return round(((dTotal - dIdle) / dTotal) * 100);
}

export function readMemory(meminfo?: string) {
  let total = os.totalmem();
  let available = os.freemem();
  try {
    const text = meminfo ?? fs.readFileSync('/proc/meminfo', 'utf8');
    const get = (k: string) => {
      const m = text.match(new RegExp(`^${k}:\\s+(\\d+) kB`, 'm'));
      return m ? Number(m[1]) * 1024 : undefined;
    };
    total = get('MemTotal') ?? total;
    available = get('MemAvailable') ?? available;
  } catch { /* dùng dự phòng */ }
  const used = Math.max(total - available, 0);
  return {
    totalBytes: total,
    usedBytes: used,
    usagePercent: total > 0 ? round((used / total) * 100) : 0,
  };
}

// Đọc bộ đếm byte của từng card mạng (bỏ qua loopback).
export function readNetCounters(procNetDev?: string): Map<string, { rx: number; tx: number }> {
  const out = new Map<string, { rx: number; tx: number }>();
  try {
    const text = procNetDev ?? fs.readFileSync('/proc/net/dev', 'utf8');
    for (const line of text.split('\n').slice(2)) {
      const [name, rest] = line.split(':');
      if (!rest) continue;
      const iface = name.trim();
      // Bỏ loopback và card ảo của Docker để không đếm trùng lưu lượng
      if (iface === 'lo' || iface === 'docker0' || /^(veth|br-)/.test(iface)) continue;
      const f = rest.trim().split(/\s+/).map(Number);
      out.set(iface, { rx: f[0] ?? 0, tx: f[8] ?? 0 });
    }
  } catch { /* hệ điều hành không có /proc */ }
  return out;
}

export class SystemCollector {
  private lastCpu = readCpuTimes();
  private lastNet = readNetCounters();
  private lastAt = Date.now();

  collect(now = Date.now()) {
    const cpuNow = readCpuTimes();
    const usagePercent = cpuPercent(this.lastCpu, cpuNow);
    this.lastCpu = cpuNow;

    const netNow = readNetCounters();
    const dt = Math.max((now - this.lastAt) / 1000, 0.001);
    const network: NetworkSample[] = [];
    for (const [iface, c] of netNow) {
      const p = this.lastNet.get(iface);
      if (!p) continue;
      network.push({
        iface,
        rxBytesPerSec: Math.max(Math.round((c.rx - p.rx) / dt), 0),
        txBytesPerSec: Math.max(Math.round((c.tx - p.tx) / dt), 0),
      });
    }
    this.lastNet = netNow;
    this.lastAt = now;

    return {
      cpu: { usagePercent, cores: os.cpus().length, load1: round(os.loadavg()[0]) },
      memory: readMemory(),
      network,
    };
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
