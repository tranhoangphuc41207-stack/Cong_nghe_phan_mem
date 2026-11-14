export interface Config {
  agentId: string;
  serverCode: string;
  apiKey: string;
  backendUrl: string;
  intervalMs: number;
  bufferMax: number;
  flushPerTick: number;
  requestTimeoutMs: number;
  dockerSocket: string;
  tls: { certFile?: string; keyFile?: string; caFile?: string };
}

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const num = (v: string | undefined, d: number) => {
    const n = Number(v);
    return Number.isFinite(n) && n > 0 ? n : d;
  };
  return {
    agentId: env.AGENT_ID ?? '',
    serverCode: env.SERVER_CODE ?? '', // mã server đã đăng ký ở Backend, vd SRV001
    apiKey: env.API_KEY ?? '',
    backendUrl: env.BACKEND_URL ?? 'http://localhost:3000/metrics',
    intervalMs: num(env.INTERVAL_MS, 5000), // mặc định 5 giây/lần theo SRS
    bufferMax: num(env.BUFFER_MAX, 720), // 720 bản x 5s = 1 giờ dữ liệu
    flushPerTick: num(env.FLUSH_PER_TICK, 20), // gửi bù tối đa 20 bản/chu kỳ, tránh dồn dập vào Backend
    requestTimeoutMs: num(env.REQUEST_TIMEOUT_MS, 4000),
    dockerSocket: env.DOCKER_SOCKET ?? '/var/run/docker.sock',
    tls: {
      certFile: env.TLS_CERT_FILE,
      keyFile: env.TLS_KEY_FILE,
      caFile: env.TLS_CA_FILE,
    },
  };
}
