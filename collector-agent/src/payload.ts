import type { BackendMetric, Telemetry } from './types.ts';

const clamp = (n: number) => Math.min(Math.max(n, 0), 100);

// Chuyển bản thu thập nội bộ sang đúng định dạng Backend yêu cầu.
export function toBackendPayload(t: Telemetry, serverCode: string): BackendMetric {
  return {
    serverCode,
    cpuUsage: clamp(t.cpu.usagePercent),
    ramUsage: clamp(t.memory.usagePercent),
    networkIn: Math.round(t.network.reduce((a, n) => a + n.rxBytesPerSec, 0)),
    networkOut: Math.round(t.network.reduce((a, n) => a + n.txBytesPerSec, 0)),
    docker: t.docker.containers.map((c) => ({
      name: c.name,
      status: c.state,
      cpuPercent: c.cpuPercent ?? 0,
      memMb: c.memUsageBytes == null ? 0 : Math.round(c.memUsageBytes / 1048576),
    })),
    recordedAt: t.timestamp,
  };
}
