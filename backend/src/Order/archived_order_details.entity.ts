import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ArchivedOrder } from './archived_order.entity';

@Entity({ name: 'archived_order_details' })
export class ArchivedOrderDetails {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitaryPrice: number;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'uuid' })
  productId: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  commandNumber: string;

  @ManyToOne(() => ArchivedOrder, (archivedOrder) => archivedOrder.orderDetails)
  order: ArchivedOrder;
}
