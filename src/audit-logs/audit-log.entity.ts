import {
  Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import type { Relation } from 'typeorm';
@Entity('audit_logs')
export class AuditLog {
  // BIGSERIAL: TypeORM trả về dạng string
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ name: 'user_id', type: 'int', nullable: true })
  userId: number | null;

  @Column({ type: 'varchar', length: 100 })
  action: string;

  @Column({ name: 'entity_type', type: 'varchar', length: 50, nullable: true })
  entityType: string | null;

  @Column({ name: 'entity_id', type: 'int', nullable: true })
  entityId: number | null;

  @Column({ type: 'text', nullable: true })
  details: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // ---- Quan hệ: người thực hiện (có thể rỗng) ----
  @ManyToOne(() => User, (u) => u.auditLogs, { nullable: true, onDelete: 'NO ACTION' })
  @JoinColumn({ name: 'user_id' })
  user: Relation<User> | null;
}
