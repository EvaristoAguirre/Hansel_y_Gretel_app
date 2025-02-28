import { Product } from 'src/Product/product.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Ingredient } from './ingredient.entity';
import { UnitOfMeasure } from './unitOfMesure.entity';

@Entity({ name: 'product_ingredients' })
export class ProductIngredient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantityOfIngredient: number;

  // ------------------------  Relaciones --------------
  @ManyToOne(
    () => UnitOfMeasure,
    (unitOfMeasure) => unitOfMeasure.productIngredients,
  )
  @JoinColumn({ name: 'unitOfMeasureId' })
  unitOfMeasure: UnitOfMeasure;

  @ManyToOne(() => Product, (product) => product.productIngredients)
  product: Product;

  @ManyToOne(() => Ingredient, (ingredient) => ingredient.productIngredients)
  ingredient: Ingredient;
}
