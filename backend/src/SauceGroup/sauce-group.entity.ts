import { Ingredient } from 'src/Ingredient/ingredient.entity';
import { Product } from 'src/Product/product.entity';
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'sauce_groups' })
export class SauceGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // Ej: "Salsas dulces", "Toppings premium"

  @Column({ default: true })
  isActive: boolean;

  @ManyToMany(() => Ingredient, (sauce) => sauce.sauceGroups)
  sauces: Ingredient[];

  @ManyToMany(() => Product, (product) => product.availableSauceGroups)
  products: Product[];
}
