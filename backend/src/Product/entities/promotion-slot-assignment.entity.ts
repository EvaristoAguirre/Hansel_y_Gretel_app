import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { PromotionSlot } from './promotion-slot.entity';

@Entity({ name: 'promotion_slot_assignments' })
export class PromotionSlotAssignment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, (product) => product.promotionSlotAssignments, {
    onDelete: 'CASCADE', // Si se elimina la promoción, se elimina la asignación
  })
  @JoinColumn({ name: 'promotionId' })
  promotion: Product;

  @Column({ name: 'promotionId' })
  promotionId: string;

  @ManyToOne(() => PromotionSlot, (slot) => slot.assignments, {
    onDelete: 'RESTRICT', // No se puede eliminar un slot si está asignado a una promoción
  })
  @JoinColumn({ name: 'slotId' })
  slot: PromotionSlot;

  @Column({ name: 'slotId' })
  slotId: string;

  @Column({ type: 'int', default: 1 })
  quantity: number; // Cantidad específica de este slot en esta promoción

  @Column({ default: false })
  isOptional: boolean; // Si es opcional en esta promoción específica

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

