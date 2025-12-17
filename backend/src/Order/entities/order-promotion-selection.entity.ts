// src/Order/order-promotion-selection.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { OrderDetails } from './order_details.entity';
import { PromotionSlot } from 'src/Product/entities/promotion-slot.entity';
import { Product } from 'src/Product/entities/product.entity';

@Entity({ name: 'order_promotion_selections' })
export class OrderPromotionSelection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  extraCostApplied: number; // Costo extra que se aplicó por esta selección

  // -------- Relaciones --------

  @ManyToOne(() => OrderDetails, (od) => od.promotionSelections, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'orderDetailId' })
  orderDetail: OrderDetails;

  @Column({ name: 'orderDetailId' })
  orderDetailId: string;

  @ManyToOne(() => PromotionSlot)
  @JoinColumn({ name: 'slotId' })
  slot: PromotionSlot;

  @Column({ name: 'slotId' })
  slotId: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'selectedProductId' })
  selectedProduct: Product;

  @Column({ name: 'selectedProductId' })
  selectedProductId: string;
}
