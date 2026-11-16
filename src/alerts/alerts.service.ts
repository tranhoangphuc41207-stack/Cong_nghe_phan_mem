
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, Repository } from 'typeorm';
import { Alert } from './alert.entity';
import { Server } from '../servers/server.entity';

export interface DockerContainer {
  name: string;
  status: string;
  cpuPercent?: number;
  memMb?: number;
}

// Dữ liệu một lần đo, được MetricsService truyền vào evaluate()
export interface MetricSample {
  cpuUsage: number;
  ramUsage: number;
  networkIn?: number;
  networkOut?: number;
  docker?: DockerContainer[];
  recordedAt: Date;
}

// Cảnh báo còn đang hoạt động
const ACTIVE = ['OPEN', 'ACKNOWLEDGED'];

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert)
    private repo: Repository<Alert>,
  ) {}

  /**
   * Kiểm tra các thông số telemetry.
   *
   * - Vượt ngưỡng và chưa có cảnh báo cùng loại:
   *   Tạo cảnh báo mới.
   * - Đã có cảnh báo đang hoạt động:
   *   Không tạo cảnh báo trùng.
   * - Mức độ cảnh báo thay đổi:
   *   Cập nhật severity và message.
   * - Chỉ số trở lại bình thường:
   *   Chuyển cảnh báo sang RESOLVED.
   */
  async evaluate(server: Server, m: MetricSample): Promise<string[]> {
    const downContainers = (m.docker ?? []).filter(
      (c) => c.status !== 'running',
    );

    // Tổng lưu lượng Network đầu vào và đầu ra (B/s)
    const hasNetworkData =
      m.networkIn !== undefined || m.networkOut !== undefined;

    const networkIn = m.networkIn ?? 0;
    const networkOut = m.networkOut ?? 0;
    const networkUsage = networkIn + networkOut;

    const warningThreshold = server.networkWarningThreshold;
    const criticalThreshold = server.networkCriticalThreshold;

    // Kiểm tra Network khi có dữ liệu và ngưỡng được cấu hình
    const networkCritical =
      hasNetworkData &&
      criticalThreshold !== null &&
      criticalThreshold !== undefined &&
      networkUsage > criticalThreshold;

    const networkWarning =
      hasNetworkData &&
      warningThreshold !== null &&
      warningThreshold !== undefined &&
      networkUsage > warningThreshold;

    const networkBreached = networkCritical || networkWarning;

    const networkSeverity = networkCritical
      ? 'CRITICAL'
      : 'WARNING';

    const networkMessage = networkCritical
      ? `Network throughput reached ${networkUsage} B/s, exceeding the critical threshold of ${criticalThreshold} B/s`
      : `Network throughput reached ${networkUsage} B/s, exceeding the warning threshold of ${warningThreshold} B/s`;

    const checks = [
      {
        type: 'HIGH_CPU',
        breached: m.cpuUsage > server.cpuThreshold,
        severity: m.cpuUsage >= 95 ? 'CRITICAL' : 'WARNING',
        message: `CPU usage reached ${m.cpuUsage}%, exceeding the ${server.cpuThreshold}% threshold`,
      },
      {
        type: 'HIGH_RAM',
        breached: m.ramUsage > server.ramThreshold,
        severity: m.ramUsage >= 95 ? 'CRITICAL' : 'WARNING',
        message: `RAM usage reached ${m.ramUsage}%, exceeding the ${server.ramThreshold}% threshold`,
      },
      {
        type: 'HIGH_NETWORK',
        breached: networkBreached,
        severity: networkSeverity,
        message: networkMessage,
      },
      {
        type: 'DOCKER_DOWN',
        breached: downContainers.length > 0,
        severity: 'WARNING',
        message: `Docker container not running: ${downContainers
          .map((c) => c.name)
          .join(', ')}`,
      },
    ];

    const breached: string[] = [];

    for (const c of checks) {
      // Không có dữ liệu Network thì không xử lý cảnh báo Network
      if (c.type === 'HIGH_NETWORK' && !hasNetworkData) {
        continue;
      }

      const active = await this.repo.findOne({
        where: {
          serverId: server.id,
          alertType: c.type,
          status: In(ACTIVE),
        },
      });

      if (c.breached) {
        breached.push(c.type);

        if (!active) {
          // Chưa có cảnh báo hoạt động thì tạo cảnh báo mới
          await this.repo.save(
            this.repo.create({
              serverId: server.id,
              alertType: c.type,
              message: c.message,
              severity: c.severity,
              status: 'OPEN',
            }),
          );
        } else if (
          active.severity !== c.severity ||
          active.message !== c.message
        ) {
          // Đã có cảnh báo thì cập nhật mức độ và nội dung
          active.severity = c.severity;
          active.message = c.message;

          await this.repo.save(active);
        }
      } else if (active) {
        // Chỉ số trở lại bình thường thì giải quyết cảnh báo
        active.status = 'RESOLVED';
        await this.repo.save(active);
      }
    }

    return breached;
  }

  /**
   * Tạo cảnh báo khi Server không gửi telemetry
   * trong hơn 90 giây.
   *
   * Không tạo cảnh báo trùng nếu đã có
   * NO_TELEMETRY đang OPEN hoặc ACKNOWLEDGED.
   */
  async createNoTelemetryAlert(server: Server): Promise<void> {
    const activeAlert = await this.repo.findOne({
      where: {
        serverId: server.id,
        alertType: 'NO_TELEMETRY',
        status: In(ACTIVE),
      },
    });

    if (activeAlert) {
      return;
    }

    const alert = this.repo.create({
      serverId: server.id,
      alertType: 'NO_TELEMETRY',
      message: `Server ${server.serverCode} has not sent telemetry for over 90 seconds`,
      severity: 'CRITICAL',
      status: 'OPEN',
    });

    await this.repo.save(alert);
  }

  /**
   * Giải quyết cảnh báo NO_TELEMETRY
   * khi Server gửi telemetry trở lại.
   */
  async resolveNoTelemetryAlert(serverId: number): Promise<void> {
    const activeAlerts = await this.repo.find({
      where: {
        serverId,
        alertType: 'NO_TELEMETRY',
        status: In(ACTIVE),
      },
    });

    for (const alert of activeAlerts) {
      alert.status = 'RESOLVED';
      await this.repo.save(alert);
    }
  }

  /**
   * Lấy danh sách cảnh báo có phân trang,
   * hỗ trợ lọc theo trạng thái, mức độ và Server.
   */
  async findAll(opts: {
    status?: string;
    severity?: string;
    serverId?: number;
    page: number;
    limit: number;
  }) {
    const limit = Math.min(Math.max(opts.limit, 1), 200);
    const page = Math.max(opts.page, 1);

    const where: FindOptionsWhere<Alert> = {};

    if (opts.status) {
      where.status = opts.status.toUpperCase();
    }

    if (opts.severity) {
      where.severity = opts.severity.toUpperCase();
    }

    if (opts.serverId !== undefined) {
      where.serverId = opts.serverId;
    }

    const [data, total] = await this.repo.findAndCount({
      where,
      order: { id: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });

    return { data, total, page, limit };
  }

  /**
   * Lấy chi tiết một cảnh báo theo ID.
   */
  async findOne(id: number) {
    const alert = await this.repo.findOne({
      where: { id },
    });

    if (!alert) {
      throw new NotFoundException('Không tìm thấy cảnh báo');
    }

    return alert;
  }

  /**
   * Xác nhận cảnh báo:
   * OPEN -> ACKNOWLEDGED
   */
  async acknowledge(id: number, userId: number) {
    const alert = await this.findOne(id);

    if (alert.status !== 'OPEN') {
      throw new ConflictException(
        'Chỉ xác nhận được cảnh báo đang ở trạng thái OPEN',
      );
    }

    alert.status = 'ACKNOWLEDGED';
    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = new Date();

    return this.repo.save(alert);
  }

  /**
   * Giải quyết cảnh báo.
   */
  async resolve(id: number) {
    const alert = await this.findOne(id);

    if (alert.status === 'RESOLVED') {
      throw new ConflictException(
        'Cảnh báo đã được đóng trước đó',
      );
    }

    alert.status = 'RESOLVED';

    return this.repo.save(alert);
  }
}
