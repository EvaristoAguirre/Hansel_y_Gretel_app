import { Table } from 'src/Table/table.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { OrderDetails } from './order_details.entity';
import { OrderState } from 'src/Enums/states.enum';

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

  @ManyToOne(() => Table, (table) => table.orders, {
    onDelete: 'SET NULL',
  })
  table: Table;

  @OneToMany(() => OrderDetails, (orderDetails) => orderDetails.order, {
    cascade: true,
    eager: false,
  })
  orderDetails: OrderDetails[];
}
