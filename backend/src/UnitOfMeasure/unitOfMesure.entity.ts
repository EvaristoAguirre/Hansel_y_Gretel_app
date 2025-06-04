import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Stock } from 'src/Stock/stock.entity';
import { UnitConversion } from './unitConversion.entity';
import { Product } from 'src/Product/product.entity';
import { Ingredient } from 'src/Ingredient/ingredient.entity';
import { ProductIngredient } from 'src/Ingredient/ingredientProduct.entity';
import { ProductTopping } from 'src/Ingredient/productAvailableToppingsGroup.entity';
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

  @Column({ nullable: true, type: 'decimal', precision: 20, scale: 10 })
  equivalenceToBaseUnit: number;

  @Column({ nullable: true })
  baseUnitId: string;

  @Column({ nullable: false, default: false })
  isConventional: boolean;

  @Column({ nullable: false, default: false })
  isBase: boolean;

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

  @OneToMany(() => Product, (product) => product.unitOfMeasure)
  products: Product[];

  @OneToMany(
    () => ProductTopping,
    (productToppings) => productToppings.unitOfMeasure,
  )
  productToppings: ProductTopping[];
}
