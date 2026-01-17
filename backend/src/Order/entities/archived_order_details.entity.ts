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

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  toppingsExtraCost: number;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @Column({ type: 'uuid' })
  productId: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  commandNumber: string;

  @Column({ type: 'json', nullable: true })
  toppings: {
    toppingId: string;
    toppingName: string;
    unitOfMeasureName: string;
    unitIndex: number;
  }[];

  @Column({ type: 'json', nullable: true })
  promotionSelections: {
    slotId: string;
    selectedProductId: string;
    selectedProductName: string;
    extraCostApplied: number;
  }[];

  @ManyToOne(() => ArchivedOrder, (archivedOrder) => archivedOrder.orderDetails)
  order: ArchivedOrder;
}
