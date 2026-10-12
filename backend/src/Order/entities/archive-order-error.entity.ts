import { Column, Entity, PrimaryColumn } from 'typeorm';

export type ArchiveOrderErrorReason =
  'NULL_PRODUCT' | 'CONFLICT' | 'FK' | 'ENUM' | 'CONNECTION' | 'OTHER';

@Entity({ name: 'archive_order_errors' })
export class ArchiveOrderError {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  runId: string;

  @Column({ type: 'uuid' })
  orderId: string;

  @Column({ type: 'timestamp' })
  attemptedAt: Date;

  @Column({ type: 'varchar', length: 32 })
  reason: ArchiveOrderErrorReason;

  @Column({ type: 'varchar', length: 8, nullable: true })
  pgCode: string | null;

  @Column({ type: 'text', nullable: true })
  message: string | null;
}
