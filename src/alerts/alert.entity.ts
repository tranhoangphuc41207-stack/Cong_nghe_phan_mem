import {
  Column, CreateDateColumn, Entity, Index, JoinColumn, ManyToOne, OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Server } from '../servers/server.entity';
import { User } from '../users/user.entity';
import { Ticket } from '../tickets/ticket.entity';
import type { Relation } from 'typeorm';
@Entity('alerts')
@Index('idx_alerts_server_status', ['serverId', 'status'])
export class Alert {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'server_id', type: 'int' })
  serverId: number;

  @Column({ name: 'alert_type', type: 'varchar', length: 50 })
  alertType: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ type: 'varchar', length: 20, default: 'WARNING' })
  severity: string;

  @Column({ type: 'varchar', length: 20, default: 'OPEN' })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Column({ name: 'acknowledged_by', type: 'int', nullable: true })
  acknowledgedBy: number | null;

  @Column({ name: 'acknowledged_at', type: 'timestamp', nullable: true })
  acknowledgedAt: Date | null;

  // ---- Quan hệ ----
  @ManyToOne(() => Server, (s) => s.alerts, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'server_id' })
  server: Relation<Server>;

  @ManyToOne(() => User, (u) => u.acknowledgedAlerts, { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'acknowledged_by' })
  acknowledgedByUser: Relation<User> | null;

  @OneToMany(() => Ticket, (t) => t.alert)
  tickets: Relation<Ticket[]>;
}
