import { Product } from 'src/Product/product.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Ingredient } from './ingredient.entity';

@Entity({ name: 'product_ingredients' })
export class ProductIngredient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantityOfIngredient: number;

  @Column({ nullable: false })
  unit: string;

  // -----------------  Relaciones  --------------//

  @ManyToOne(() => Product, (product) => product.productIngredients)
  product: Product;

  @ManyToOne(() => Ingredient, (ingredient) => ingredient.productIngredients)
  ingredient: Ingredient;
}
