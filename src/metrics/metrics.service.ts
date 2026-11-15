
import {
  Injectable,
  NotFoundException,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { History } from './history.entity';
import { CreateMetricDto } from './dto/create-metric.dto';
import { Server } from '../servers/server.entity';
import { ServerStatus } from '../servers/server-status.enum';
import { AlertsService } from '../alerts/alerts.service';

@Injectable()
export class MetricsService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MetricsService.name);

  // Kiểm tra trạng thái Server mỗi 5 giây
  private offlineCheckTimer: ReturnType<typeof setInterval> | undefined;

  // Tránh hai lần kiểm tra chạy chồng lên nhau
  private isCheckingOfflineServers = false;

  constructor(
    @InjectRepository(History)
    private historyRepo: Repository<History>,

    @InjectRepository(Server)
    private serverRepo: Repository<Server>,

    private readonly alerts: AlertsService,
  ) {}

  /**
   * Khởi động bộ kiểm tra Offline khi Backend chạy.
   */
  onModuleInit(): void {
    // Kiểm tra ngay khi khởi động
    void this.checkOfflineServers().catch((error: unknown) => {
      this.logOfflineCheckError(error);
    });

    // Sau đó kiểm tra định kỳ mỗi 5 giây
    this.offlineCheckTimer = setInterval(() => {
      void this.checkOfflineServers().catch((error: unknown) => {
        this.logOfflineCheckError(error);
      });
    }, 5000);
  }

  /**
   * Dừng bộ kiểm tra khi Backend tắt.
   */
  onModuleDestroy(): void {
    if (this.offlineCheckTimer) {
      clearInterval(this.offlineCheckTimer);
      this.offlineCheckTimer = undefined;
    }
  }

  private logOfflineCheckError(error: unknown): void {
    const message =
      error instanceof Error ? error.stack ?? error.message : String(error);

    this.logger.error('Offline detection check failed', message);
  }

  /**
   * Kiểm tra máy chủ có mất telemetry quá 90 giây hay không.
   */
  private async checkOfflineServers(): Promise<void> {
    if (this.isCheckingOfflineServers) {
      return;
    }

    this.isCheckingOfflineServers = true;

    try {
      const servers = await this.serverRepo.find();
      const now = Date.now();

      for (const server of servers) {
        // Lấy lần gửi telemetry gần nhất
        const latestMetric = await this.historyRepo.findOne({
          where: { serverId: server.id },
          order: {
            recordedAt: 'DESC',
            id: 'DESC',
          },
        });

        // Nếu chưa từng gửi telemetry thì tính từ lúc tạo Server
        const lastSeenAt = latestMetric?.recordedAt ?? server.createdAt;

        const elapsedMs = now - lastSeenAt.getTime();

        // Bỏ qua timestamp không hợp lệ
        if (!Number.isFinite(elapsedMs)) {
          continue;
        }

        // Chỉ Offline khi quá 90 giây
        if (elapsedMs > 90 * 1000) {
          if (server.status !== ServerStatus.OFFLINE) {
            await this.serverRepo.update(server.id, {
              status: ServerStatus.OFFLINE,
            });

            server.status = ServerStatus.OFFLINE;
          }

          // Tạo cảnh báo, không tạo trùng nếu đã có cảnh báo hoạt động
          await this.alerts.createNoTelemetryAlert(server);
        }
      }
    } finally {
      this.isCheckingOfflineServers = false;
    }
  }

  /**
   * Nhận telemetry từ Collector Agent.
   */
  async ingest(dto: CreateMetricDto) {
    const server = await this.serverRepo.findOne({
      where: { serverCode: dto.serverCode },
    });

    if (!server) {
      throw new NotFoundException(
        `Không tìm thấy máy chủ ${dto.serverCode}`,
      );
    }

    const recordedAt = dto.recordedAt
      ? new Date(dto.recordedAt)
      : new Date();

    // 1. Lưu lịch sử telemetry
    const record = await this.historyRepo.save(
      this.historyRepo.create({
        serverId: server.id,
        cpuUsage: dto.cpuUsage,
        ramUsage: dto.ramUsage,
        networkIn: dto.networkIn ?? null,
        networkOut: dto.networkOut ?? null,
        recordedAt,
        dockerInfo: dto.docker ?? null,
      }),
    );

    // 2. Server gửi dữ liệu trở lại:
    // Giải quyết cảnh báo NO_TELEMETRY đang hoạt động
    await this.alerts.resolveNoTelemetryAlert(server.id);

    // 3. Kiểm tra các ngưỡng cảnh báo
    const breached = await this.alerts.evaluate(server, {
      cpuUsage: dto.cpuUsage,
      ramUsage: dto.ramUsage,
      networkIn: dto.networkIn,
      networkOut: dto.networkOut,
      docker: dto.docker,
      recordedAt,
    });

    // 4. Cập nhật trạng thái Server
    const status =
      breached.length > 0
        ? ServerStatus.WARNING
        : ServerStatus.ONLINE;

    if (server.status !== status) {
      await this.serverRepo.update(server.id, { status });
    }

    return {
      historyId: record.id,
      serverCode: server.serverCode,
      status,
      alerts: breached,
    };
  }

  /**
   * Lấy lịch sử telemetry của một Server.
   */
  findHistory(serverId: number, limit: number) {
    return this.historyRepo.find({
      where: { serverId },
      order: { recordedAt: 'DESC' },
      take: Math.min(Math.max(limit, 1), 1000),
    });
  }

  /**
   * Lấy số liệu mới nhất của tất cả Server.
   * Phục vụ Dashboard.
   */
  async findLatestAll() {
    const rows: any[] = await this.historyRepo.query(`
      SELECT s.id AS "serverId", s.server_code AS "serverCode", s.name, s.status,
             s.cpu_threshold AS "cpuThreshold", s.ram_threshold AS "ramThreshold",
             h.cpu_usage AS "cpuUsage", h.ram_usage AS "ramUsage",
             h.network_in AS "networkIn", h.network_out AS "networkOut",
             h.docker_info AS "dockerInfo", h.recorded_at AS "recordedAt"
      FROM servers s
      LEFT JOIN LATERAL (
        SELECT cpu_usage, ram_usage, network_in, network_out, docker_info, recorded_at
        FROM history
        WHERE server_id = s.id
        ORDER BY recorded_at DESC, id DESC
        LIMIT 1
      ) h ON true
      ORDER BY s.id
    `);

    // Numeric và bigint của PostgreSQL có thể được trả về dạng string
    const num = (v: unknown) =>
      v === null || v === undefined ? null : Number(v);

    return rows.map((r) => ({
      serverId: r.serverId,
      serverCode: r.serverCode,
      name: r.name,
      status: r.status,
      cpuThreshold: num(r.cpuThreshold),
      ramThreshold: num(r.ramThreshold),
      latest: r.recordedAt
        ? {
            cpuUsage: num(r.cpuUsage),
            ramUsage: num(r.ramUsage),
            networkIn: num(r.networkIn),
            networkOut: num(r.networkOut),
            docker: r.dockerInfo ?? [],
            recordedAt: r.recordedAt,
          }
        : null,
    }));
  }
}
