import { Stock } from 'src/Stock/stock.entity';
import {
  Column,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ProductIngredient } from './ingredientProduct.entity';

@Entity({ name: 'ingredients' })
export class Ingredient {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column()
  isActive: boolean;

  // -------------- Relaciones -----------------//
  @OneToOne(() => Stock, (stock) => stock.ingredient)
  stock: Stock;

  @OneToMany(
    () => ProductIngredient,
    (productIngredient) => productIngredient.ingredient,
  )
  productIngredients: ProductIngredient[];
}
