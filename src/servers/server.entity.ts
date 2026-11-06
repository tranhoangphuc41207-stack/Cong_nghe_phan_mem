import {
  Check, Column, CreateDateColumn, Entity, OneToMany, PrimaryGeneratedColumn,
} from 'typeorm';
import { ServerStatus } from './server-status.enum';
import { History } from '../metrics/history.entity';
import { Alert } from '../alerts/alert.entity';
import { Ticket } from '../tickets/ticket.entity';
import type { Relation } from 'typeorm';
// numeric trong Postgres được trả về dạng string, nên chuyển sang number
const numeric = {
  to: (v?: number) => v,
  from: (v?: string | null) => (v === null || v === undefined ? v : parseFloat(v)),
};

@Entity('servers')
@Check(`"status" IN ('ONLINE', 'OFFLINE', 'WARNING', 'UNKNOWN')`)
export class Server {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ name: 'server_code', type: 'varchar', length: 50, unique: true })
  serverCode: string;

  @Column({ type: 'varchar', length: 100 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ type: 'varchar', length: 200, nullable: true })
  location: string | null;

  @Column({ name: 'qr_code', type: 'varchar', length: 255, unique: true, nullable: true })
  qrCode: string | null;

  @Column({ type: 'varchar', length: 20, default: ServerStatus.UNKNOWN })
  status: ServerStatus;

  @Column({ name: 'cpu_threshold', type: 'numeric', precision: 5, scale: 2, default: 80, transformer: numeric })
  cpuThreshold: number;

  @Column({ name: 'ram_threshold', type: 'numeric', precision: 5, scale: 2, default: 80, transformer: numeric })
  ramThreshold: number;

  // ---- Thông tin phần cứng và bảo hành ----
  @Column({ type: 'varchar', length: 100, nullable: true })
  manufacturer: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  model: string | null;

  @Column({ name: 'serial_number', type: 'varchar', length: 100, unique: true, nullable: true })
  serialNumber: string | null;

  @Column({ name: 'cpu_model', type: 'varchar', length: 100, nullable: true })
  cpuModel: string | null;

  @Column({ name: 'ram_gb', type: 'int', nullable: true })
  ramGb: number | null;

  @Column({ name: 'storage_gb', type: 'int', nullable: true })
  storageGb: number | null;

  // kiểu date trả về chuỗi 'YYYY-MM-DD'
  @Column({ name: 'purchase_date', type: 'date', nullable: true })
  purchaseDate: string | null;

  @Column({ name: 'warranty_expiry', type: 'date', nullable: true })
  warrantyExpiry: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // ---- Quan hệ ----
  @OneToMany(() => History, (h) => h.server)
  history: Relation<History[]>;

  @OneToMany(() => Alert, (a) => a.server)
  alerts: Relation<Alert[]>;

  @OneToMany(() => Ticket, (t) => t.server)
  tickets: Relation<Ticket[]>;
}
