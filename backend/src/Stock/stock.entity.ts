import { Ingredient } from 'src/Ingredient/ingredient.entity';
import { Product } from 'src/Product/product.entity';
import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'stock' })
export class Stock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', default: 0 })
  quantityInStock: number;

  @Column({ type: 'int', nullable: true })
  minimumStock: number;

  //@Column()
  //unitOfMeasureId: string;

  // -------------- Relaciones -----------------//

  @OneToOne(() => Product, (product) => product.stock)
  @JoinColumn()
  product: Product;

  @OneToOne(() => Ingredient, (ingredient) => ingredient.stock)
  @JoinColumn()
  ingredient: Ingredient;
}
