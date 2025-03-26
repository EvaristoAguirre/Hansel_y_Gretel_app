import { OrderState } from 'src/Enums/states.enum';
import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { ArchivedOrderDetails } from './archived_order_details.entity';

@Entity({ name: 'archived_orders' })
export class ArchivedOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  date: Date;

  @Column({ type: 'enum', enum: OrderState })
  state: OrderState;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ nullable: true })
  numberCustomers: number;

  @Column({ nullable: true })
  comment: string;

  @Column({ type: 'varchar', length: 20, unique: true, nullable: true })
  commandNumber: string;

  @Column()
  tableId: string;

  @OneToMany(
    () => ArchivedOrderDetails,
    (archivedOrderDetails) => archivedOrderDetails.order,
    {
      cascade: true,
    },
  )
  orderDetails: ArchivedOrderDetails[];
}
