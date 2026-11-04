import http from 'node:http';
import type { ContainerSample } from '../types.ts';

// Gọi Docker Engine API qua unix socket, không cần thư viện ngoài.
function dockerGet(socketPath: string, path: string, timeoutMs = 3000): Promise<any> {
  return new Promise((resolve, reject) => {
    const req = http.request({ socketPath, path, method: 'GET', timeout: timeoutMs }, (res) => {
      let body = '';
      res.setEncoding('utf8');
      res.on('data', (d) => (body += d));
      res.on('end', () => {
        if ((res.statusCode ?? 500) >= 300) return reject(new Error(`docker ${res.statusCode}`));
        try { resolve(JSON.parse(body)); } catch (e) { reject(e); }
      });
    });
    req.on('timeout', () => req.destroy(new Error('docker timeout')));
    req.on('error', reject);
    req.end();
  });
}

export function calcContainerCpu(stats: any): number | null {
  try {
    const cpuDelta = stats.cpu_stats.cpu_usage.total_usage - stats.precpu_stats.cpu_usage.total_usage;
    const sysDelta = stats.cpu_stats.system_cpu_usage - stats.precpu_stats.system_cpu_usage;
    const cpus = stats.cpu_stats.online_cpus ?? stats.cpu_stats.cpu_usage.percpu_usage?.length ?? 1;
    if (sysDelta > 0 && cpuDelta >= 0) return Math.round((cpuDelta / sysDelta) * cpus * 10000) / 100;
  } catch { /* thiếu số liệu */ }
  return null;
}

export function calcContainerMem(stats: any): { used: number | null; limit: number | null } {
  try {
    const usage = stats.memory_stats.usage;
    const cache = stats.memory_stats.stats?.inactive_file ?? stats.memory_stats.stats?.cache ?? 0;
    return { used: usage - cache, limit: stats.memory_stats.limit ?? null };
  } catch {
    return { used: null, limit: null };
  }
}

export async function collectDocker(socketPath: string): Promise<{ available: boolean; containers: ContainerSample[] }> {
  let list: any[];
  try {
    list = await dockerGet(socketPath, '/containers/json?all=true');
  } catch {
    return { available: false, containers: [] }; // máy không có Docker hoặc không có quyền
  }
  const containers = await Promise.all(
    list.map(async (c): Promise<ContainerSample> => {
      const base = {
        id: String(c.Id).slice(0, 12),
        name: String(c.Names?.[0] ?? c.Id).replace(/^\//, ''),
        image: String(c.Image),
        state: String(c.State),
      };
      if (c.State !== 'running') {
        return { ...base, cpuPercent: null, memUsageBytes: null, memLimitBytes: null };
      }
      try {
        const s = await dockerGet(socketPath, `/containers/${c.Id}/stats?stream=false&one-shot=false`, 4000);
        const m = calcContainerMem(s);
        return { ...base, cpuPercent: calcContainerCpu(s), memUsageBytes: m.used, memLimitBytes: m.limit };
      } catch {
        return { ...base, cpuPercent: null, memUsageBytes: null, memLimitBytes: null };
      }
    }),
  );
  return { available: true, containers };
}
