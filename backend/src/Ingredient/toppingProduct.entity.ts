import { Product } from 'src/Product/product.entity';
import { UnitOfMeasure } from 'src/UnitOfMeasure/unitOfMesure.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Ingredient } from './ingredient.entity';

@Entity({ name: 'product_toppings' })
export class ProductTopping {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantityOfTopping: number;

  // ------------------------  Relaciones --------------
  @ManyToOne(
    () => UnitOfMeasure,
    (unitOfMeasure) => unitOfMeasure.productToppings,
  )
  @JoinColumn({ name: 'unitOfMeasureId' })
  unitOfMeasure: UnitOfMeasure;

  @ManyToOne(() => Product, (product) => product.productToppings)
  product: Product;

  @ManyToOne(() => Ingredient, (ingredient) => ingredient.productToppings)
  topping: Ingredient;
}
