import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { DailyCash } from './daily-cash.entity';
import { DailyCashMovementType } from 'src/Enums/dailyCash.enum';
import { PaymentMethod } from 'src/Enums/paymentMethod.enum';

@Entity({ name: 'cash_movements' })
export class CashMovement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: DailyCashMovementType })
  type: DailyCashMovementType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'jsonb' })
  payments: {
    amount: number;
    paymentMethod: PaymentMethod;
  }[];

  // --------- Relaciones ---------
  @ManyToOne(() => DailyCash, (dailyCash) => dailyCash.movements, {
    eager: false,
  })
  @JoinColumn({ name: 'dailyCashId' })
  dailyCash: DailyCash;
}
