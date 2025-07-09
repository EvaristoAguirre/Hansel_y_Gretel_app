import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { PaymentMethod } from 'src/Enums/paymentMethod.enum';
import { ArchivedOrder } from './archived_order.entity';

@Entity({ name: 'archived_order_payments' })
export class ArchivedOrderPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentMethod })
  methodOfPayment: PaymentMethod;

  @CreateDateColumn()
  createdAt: Date;

  // ---------------- relaciones

  @ManyToOne(() => ArchivedOrder, (order) => order.payments, {
    onDelete: 'CASCADE',
  })
  order: ArchivedOrder;
}
