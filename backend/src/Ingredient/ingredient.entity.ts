import { Stock } from 'src/Stock/stock.entity';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductIngredient } from './ingredientProduct.entity';
import { IsNumber, IsOptional, Min } from 'class-validator';
import { UnitOfMeasure } from 'src/UnitOfMeasure/unitOfMesure.entity';
import { ToppingsGroup } from 'src/ToppingsGroup/toppings-group.entity';
import { ProductTopping } from './toppingProduct.entity';

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

  @Column({ default: false })
  isTopping: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsOptional()
  extraCost: number;

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

  @ManyToMany(() => ToppingsGroup, (group) => group.toppings)
  toppingsGroups: ToppingsGroup[];

  @OneToMany(() => ProductTopping, (productToppings) => productToppings.topping)
  productToppings: ProductTopping[];
}
