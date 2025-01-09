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

  @Column({ default: false })
  isActive: boolean;

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
