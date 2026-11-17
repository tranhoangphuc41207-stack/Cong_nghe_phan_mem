
import {
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { Alert } from './alert.entity';

@WebSocketGateway({
  cors: {
    origin: true,
    credentials: true,
  },
})
export class AlertsGateway implements OnGatewayInit {
  @WebSocketServer()
  server: Server;

  constructor(private readonly jwtService: JwtService) {}

  // Xác thực JWT trước khi cho phép kết nối Socket.IO
  afterInit(server: Server) {
    server.use((client: Socket, next) => {
      const authToken = client.handshake.auth?.token;
      const authorization = client.handshake.headers.authorization;

      const bearerToken =
        typeof authorization === 'string'
          ? authorization.replace(/^Bearer\s+/i, '')
          : undefined;

      const token =
        typeof authToken === 'string' ? authToken : bearerToken;

      if (!token) {
        return next(new Error('Unauthorized'));
      }

      this.jwtService
        .verifyAsync(token)
        .then((payload) => {
          client.data.user = payload;
          next();
        })
        .catch(() => {
          next(new Error('Unauthorized'));
        });
    });
  }

  // Phát khi có cảnh báo mới
  emitNew(alert: Alert) {
    this.server?.emit('alert:new', this.toPayload(alert));
  }

  // Phát khi cảnh báo được cập nhật
  emitUpdated(alert: Alert) {
    this.server?.emit('alert:updated', this.toPayload(alert));
  }

  // Phát khi cảnh báo được giải quyết
  emitResolved(alert: Alert) {
    this.server?.emit('alert:resolved', this.toPayload(alert));
  }

  // Chỉ gửi các trường cần thiết cho Frontend
  private toPayload(alert: Alert) {
    return {
      id: alert.id,
      serverId: alert.serverId,
      alertType: alert.alertType,
      message: alert.message,
      severity: alert.severity,
      status: alert.status,
      createdAt: alert.createdAt,
      acknowledgedBy: alert.acknowledgedBy,
      acknowledgedAt: alert.acknowledgedAt,
    };
  }
}
