import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ArchivedOrder } from './archived_order.entity';

@Entity({ name: 'archived_order_details' })
export class ArchivedOrderDetails {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  cantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitaryPrice: number;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @Column()
  productId: string;

  @ManyToOne(() => ArchivedOrder, (archivedOrder) => archivedOrder.orderDetails)
  order: ArchivedOrder;
}
