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

  @Column({ type: 'enum', enum: OrderState, default: OrderState.PENDING })
  state: OrderState;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Table, (table) => table.orders)
  table: Table;

  @OneToMany(() => OrderDetails, (orderDetails) => orderDetails.order, {
    cascade: true,
  })
  orderDetails: OrderDetails[];
}
