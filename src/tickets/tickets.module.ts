import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Ticket } from './ticket.entity';
import { MaintenanceLog } from './maintenance-log.entity';

// Hiện chỉ đăng ký Entity với ORM. Controller, Service, DTO sẽ bổ sung khi làm API phiếu bảo trì.
@Module({
  imports: [TypeOrmModule.forFeature([Ticket, MaintenanceLog])],
  exports: [TypeOrmModule],
})
export class TicketsModule {}
