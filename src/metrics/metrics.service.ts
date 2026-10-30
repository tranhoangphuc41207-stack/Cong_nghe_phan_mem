import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { History } from './history.entity';
import { CreateMetricDto } from './dto/create-metric.dto';
import { Server } from '../servers/server.entity';
import { ServerStatus } from '../servers/server-status.enum';
import { AlertsService } from '../alerts/alerts.service';

@Injectable()
export class MetricsService {
  constructor(
    @InjectRepository(History) private historyRepo: Repository<History>,
    @InjectRepository(Server) private serverRepo: Repository<Server>,
    private readonly alerts: AlertsService,
  ) {}

  async ingest(dto: CreateMetricDto) {
    const server = await this.serverRepo.findOne({ where: { serverCode: dto.serverCode } });
    if (!server) throw new NotFoundException(`Không tìm thấy máy chủ ${dto.serverCode}`);

    const recordedAt = dto.recordedAt ? new Date(dto.recordedAt) : new Date();

    // 1. Lưu lịch sử
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

    // 2. Chuyển dữ liệu sang module Alerting để kiểm tra ngưỡng
    const breached = await this.alerts.evaluate(server, {
      cpuUsage: dto.cpuUsage,
      ramUsage: dto.ramUsage,
      networkIn: dto.networkIn,
      networkOut: dto.networkOut,
      docker: dto.docker,
      recordedAt,
    });

    // 3. Có dữ liệu gửi về nghĩa là máy đang chạy: ONLINE, hoặc WARNING nếu đang vi phạm
    const status = breached.length > 0 ? ServerStatus.WARNING : ServerStatus.ONLINE;
    if (server.status !== status) {
      await this.serverRepo.update(server.id, { status });
    }

    return { historyId: record.id, serverCode: server.serverCode, status, alerts: breached };
  }

  findHistory(serverId: number, limit: number) {
    return this.historyRepo.find({
      where: { serverId },
      order: { recordedAt: 'DESC' },
      take: Math.min(Math.max(limit, 1), 1000),
    });
  }

  // Số liệu mới nhất của TẤT CẢ máy chủ (cho Dashboard).
  // Máy chủ chưa có số liệu nào thì `latest` là null.
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

    // numeric và bigint của Postgres về dạng chuỗi -> đổi sang số
    const num = (v: unknown) => (v === null || v === undefined ? null : Number(v));

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
