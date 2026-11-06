import {
  Check, Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { TicketPriority, TicketStatus } from './ticket.enums';
import { Server } from '../servers/server.entity';
import { Alert } from '../alerts/alert.entity';
import { User } from '../users/user.entity';
import { MaintenanceLog } from './maintenance-log.entity';
import type { Relation } from 'typeorm';
@Entity('tickets')
@Check(`"status" IN ('OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED')`)
@Index('idx_tickets_assigned_status', ['assignedTo', 'status'])
export class Ticket {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ticket_code', type: 'varchar', length: 50, unique: true })
  ticketCode: string;

  @Column({ name: 'server_id', type: 'int' })
  serverId: number;

  @Column({ name: 'alert_id', type: 'int', nullable: true })
  alertId: number | null;

  @Column({ type: 'varchar', length: 200 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 20, default: TicketStatus.OPEN })
  status: TicketStatus;

  @Column({ type: 'varchar', length: 20, default: TicketPriority.MEDIUM })
  priority: TicketPriority;

  @Column({ name: 'created_by', type: 'int', nullable: true })
  createdBy: number | null;

  @Column({ name: 'assigned_to', type: 'int', nullable: true })
  assignedTo: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'resolved_at', type: Date, nullable: true })
  resolvedAt: Date | null;

  @Column({ name: 'closed_at', type: Date, nullable: true })
  closedAt: Date | null;

  // ---- Quan hệ ----
  @ManyToOne(() => Server, (s) => s.tickets, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'server_id' })
  server: Relation<Server>;

  @ManyToOne(() => Alert, (a) => a.tickets, { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'alert_id' })
  alert: Relation<Alert> | null;

  @ManyToOne(() => User, (u) => u.createdTickets, { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'created_by' })
  createdByUser: Relation<User> | null;

  @ManyToOne(() => User, (u) => u.assignedTickets, { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'assigned_to' })
  assignedToUser: Relation<User> | null;

  @OneToMany(() => MaintenanceLog, (m) => m.ticket)
  maintenanceLogs: Relation<MaintenanceLog[]>;
}
