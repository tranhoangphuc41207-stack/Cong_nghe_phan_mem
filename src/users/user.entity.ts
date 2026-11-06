import {
  Check, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn,
} from 'typeorm';
import { Role } from '../common/role.enum';
import { Alert } from '../alerts/alert.entity';
import { Ticket } from '../tickets/ticket.entity';
import { MaintenanceLog } from '../tickets/maintenance-log.entity';
import { AuditLog } from '../audit-logs/audit-log.entity';
import type { Relation } from 'typeorm';
@Entity('users')
@Check(`"role" IN ('ADMIN', 'OPERATOR', 'TECHNICIAN')`)
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'full_name', type: 'varchar', length: 100 })
  fullName: string;

  @Column({ type: 'varchar', length: 150, unique: true })
  email: string;

  // select: false -> mặc định không đọc ra khi truy vấn thông thường
  @Column({ name: 'password_hash', type: 'text', select: false })
  passwordHash: string;

  @Column({ type: 'varchar', length: 20 })
  role: Role;

  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // ---- Quan hệ (không tự tải; chỉ tải khi truy vấn yêu cầu `relations`) ----
  @OneToMany(() => Alert, (a) => a.acknowledgedByUser)
  acknowledgedAlerts: Relation<Alert[]>;

  @OneToMany(() => Ticket, (t) => t.createdByUser)
  createdTickets: Relation<Ticket[]>;

  @OneToMany(() => Ticket, (t) => t.assignedToUser)
  assignedTickets: Relation<Ticket[]>;

  @OneToMany(() => MaintenanceLog, (m) => m.user)
  maintenanceLogs: Relation<MaintenanceLog[]>;

  @OneToMany(() => AuditLog, (l) => l.user)
  auditLogs: Relation<AuditLog[]>;
}
