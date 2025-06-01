import { Ingredient } from 'src/Ingredient/ingredient.entity';
import { Product } from 'src/Product/product.entity';
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'toppings_groups' })
export class ToppingsGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // Ej: "Salsas dulces", "Toppings premium"

  @Column({ default: true })
  isActive: boolean;

  // @Column({ type: 'decimal', precision: 10, scale: 2 })
  // quantityOftopping: number;

  // ------------------------  Relaciones --------------
  @ManyToMany(() => Ingredient, (sauce) => sauce.toppingsGroups)
  toppings: Ingredient[];

  @ManyToMany(() => Product, (product) => product.availableToppingsGroups)
  products: Product[];
}
