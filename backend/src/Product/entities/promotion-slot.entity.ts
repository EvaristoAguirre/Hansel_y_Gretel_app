import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  // ManyToOne,
  OneToMany,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  // JoinColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { PromotionSlotOption } from './promotion-slot-option.entity';

@Entity({ name: 'promotion_slots' })
export class PromotionSlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string; // Ej: "Torta", "Bebida caliente", "Acompañamiento"

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string; // Descripción opcional del slot

  @Column({ type: 'int', default: 1 })
  quantity: number; // Cantidad de este slot en la promoción

  @Column({ type: 'int', default: 0 })
  displayOrder: number; // Orden de presentación en UI

  @Column({ default: false })
  isOptional: boolean; // Si el cliente puede omitir este slot

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;

  // -------- Relaciones --------

  @ManyToOne(() => Product, (product) => product.promotionSlots, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'promotionId' })
  promotion: Product;

  @Column({ name: 'promotionId' })
  promotionId: string;

  @OneToMany(() => PromotionSlotOption, (option) => option.slot, {
    cascade: true,
  })
  options: PromotionSlotOption[];
}
