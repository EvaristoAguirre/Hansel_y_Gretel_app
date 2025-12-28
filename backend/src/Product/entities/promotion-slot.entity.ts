import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { PromotionSlotOption } from './promotion-slot-option.entity';
import { PromotionSlotAssignment } from './promotion-slot-assignment.entity';

@Entity({ name: 'promotion_slots' })
export class PromotionSlot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 100 })
  name: string; // Ej: "Torta", "Bebida caliente", "Acompañamiento"

  @Column({ type: 'varchar', length: 255, nullable: true })
  description: string; // Descripción opcional del slot

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn({ nullable: true })
  deletedAt: Date;

  // -------- Relaciones --------

  // Relación Many-to-Many con Product (Promotion) a través de PromotionSlotAssignment
  @OneToMany(() => PromotionSlotAssignment, (assignment) => assignment.slot)
  assignments: PromotionSlotAssignment[];

  @OneToMany(() => PromotionSlotOption, (option) => option.slot, {
    cascade: true,
  })
  options: PromotionSlotOption[];
}
