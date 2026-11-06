import {
  Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { Ticket } from './ticket.entity';
import { User } from '../users/user.entity';
import type { Relation } from 'typeorm';
@Entity('maintenance_logs')
export class MaintenanceLog {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'ticket_id', type: 'int' })
  ticketId: number;

  @Column({ name: 'user_id', type: 'int', nullable: true })
  userId: number | null;

  @Column({ type: 'text' })
  action: string;

  @Column({ name: 'root_cause', type: 'text', nullable: true })
  rootCause: string | null;

  @Column({ name: 'corrective_action', type: 'text', nullable: true })
  correctiveAction: string | null;

  @Column({ type: 'text', nullable: true })
  result: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // ---- Quan hệ ----
  @ManyToOne(() => Ticket, (t) => t.maintenanceLogs, { nullable: false, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'ticket_id' })
  ticket: Relation<Ticket>;

  @ManyToOne(() => User, (u) => u.maintenanceLogs, { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User> | null;
}
