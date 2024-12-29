import { TableState } from 'src/Enums/states.enum';
import { Order } from 'src/Order/order.entity';
import { Room } from 'src/Room/room.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'tables' })
export class Table {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, unique: true })
  name: string;

  @Column({ nullable: true })
  coment: string;

  @Column({ nullable: true, unique: true })
  number: number;

  // @Column({ nullable: false })
  // numberCustomers: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'enum', enum: TableState, default: TableState.AVAILABLE })
  state: TableState;

  @ManyToOne(() => Room, (room) => room.tables)
  room: Room;

  @OneToMany(() => Order, (order) => order.table)
  orders: Order[];
}
