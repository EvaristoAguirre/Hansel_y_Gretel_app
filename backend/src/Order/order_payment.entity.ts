import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Order } from './order.entity';
import { PaymentMethod } from 'src/Enums/paymentMethod.enum';

@Entity({ name: 'order_payments' })
export class OrderPayment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'enum', enum: PaymentMethod })
  methodOfPayment: PaymentMethod;

  @CreateDateColumn()
  createdAt: Date;

  // ---------------- relaciones

  @ManyToOne(() => Order, (order) => order.payments, { onDelete: 'CASCADE' })
  order: Order;
}
