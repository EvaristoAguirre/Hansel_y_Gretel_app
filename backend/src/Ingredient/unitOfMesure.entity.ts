import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Ingredient } from './ingredient.entity';
import { ProductIngredient } from './ingredientProduct.entity';
import { Stock } from 'src/Stock/stock.entity';
import { UnitConversion } from './unitConversion.entity';

@Entity({ name: 'units_of_measure' })
export class UnitOfMeasure {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, unique: true })
  name: string;

  @Column({ nullable: true, unique: true })
  abbreviation: string;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  equivalenceToBaseUnit: number;

  @Column({ nullable: true })
  baseUnitId: string;

  @Column({ nullable: false, default: false })
  isConventional: boolean;

  // ------------------- Relaciones ---------------------
  @ManyToOne(() => UnitOfMeasure, { nullable: true })
  @JoinColumn({ name: 'baseUnitId' })
  baseUnit: UnitOfMeasure;

  @OneToMany(() => Ingredient, (ingredient) => ingredient.unitOfMeasure)
  ingredients: Ingredient[];

  @OneToMany(
    () => ProductIngredient,
    (productIngredient) => productIngredient.unitOfMeasure,
  )
  productIngredients: ProductIngredient[];

  @OneToMany(() => Stock, (stock) => stock.unitOfMeasure)
  stock: Stock[];

  @OneToMany(() => UnitConversion, (conversion) => conversion.fromUnit, {
    eager: true,
  })
  fromConversions: UnitConversion[];

  @OneToMany(() => UnitConversion, (conversion) => conversion.toUnit, {
    eager: true,
  })
  toConversions: UnitConversion[];
}
