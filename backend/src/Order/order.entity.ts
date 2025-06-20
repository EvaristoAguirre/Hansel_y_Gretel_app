import { Table } from 'src/Table/table.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrderDetails } from './order_details.entity';
import { OrderState } from 'src/Enums/states.enum';
import { DailyCash } from 'src/daily-cash/daily-cash.entity';
import { PaymentMethod } from 'src/Enums/paymentMethod.enum';

@Entity({ name: 'orders' })
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  date: Date;

  @Column({ type: 'enum', enum: OrderState, default: OrderState.OPEN })
  state: OrderState;

  @Column({ default: true })
  isActive: boolean;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ nullable: false })
  numberCustomers: number;

  @Column({ nullable: true })
  comment: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  commandNumber: string;

  @Column({ type: 'enum', enum: PaymentMethod, nullable: true })
  methodOfPayment: PaymentMethod;

  // --------- Relaciones ---------
  @ManyToOne(() => Table, (table) => table.orders, {
    onDelete: 'SET NULL',
  })
  table: Table;

  @OneToMany(() => OrderDetails, (orderDetails) => orderDetails.order, {
    cascade: true,
    eager: false,
  })
  @JoinColumn({ name: 'orders_orderDetails' })
  orderDetails: OrderDetails[];

  @ManyToOne(() => DailyCash, (dailyCash) => dailyCash.orders, {
    onDelete: 'SET NULL',
    eager: false,
  })
  @JoinColumn({ name: 'dailyCashId' })
  dailyCash: DailyCash;
}
