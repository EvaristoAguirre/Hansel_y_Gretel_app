import { Stock } from 'src/Stock/stock.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductIngredient } from './ingredientProduct.entity';
import { IsNumber, Min } from 'class-validator';
import { UnitOfMeasure } from 'src/UnitOfMeasure/unitOfMesure.entity';

@Entity({ name: 'ingredients' })
export class Ingredient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, unique: true })
  @Index({ unique: true })
  name: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  @IsNumber()
  @Min(0)
  cost: number;

  @Column({ type: 'enum', enum: ['masa', 'volumen', 'unidad'] })
  type: 'masa' | 'volumen' | 'unidad';

  // -------------- Relaciones -----------------//
  @OneToOne(() => Stock, (stock) => stock.ingredient)
  stock: Stock;

  @OneToMany(
    () => ProductIngredient,
    (productIngredient) => productIngredient.ingredient,
  )
  productIngredients: ProductIngredient[];

  @ManyToOne(() => UnitOfMeasure, (unitOfMesure) => unitOfMesure.ingredients)
  @JoinColumn({ name: 'unitOfMeasureId' })
  unitOfMeasure: UnitOfMeasure;
}
