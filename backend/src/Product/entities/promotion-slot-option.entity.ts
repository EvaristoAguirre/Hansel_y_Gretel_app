import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { PromotionSlot } from './promotion-slot.entity';
import { Product } from './product.entity';

@Entity({ name: 'promotion_slot_options' })
export class PromotionSlotOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  extraCost: number; // Costo adicional si aplica (ej: torta premium +$500)

  @Column({ default: true })
  isActive: boolean;

  // -------- Relaciones --------

  @ManyToOne(() => PromotionSlot, (slot) => slot.options, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'slotId' })
  slot: PromotionSlot;

  @Column({ name: 'slotId' })
  slotId: string;

  @ManyToOne(() => Product, { eager: true })
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ name: 'productId' })
  productId: string;
}
