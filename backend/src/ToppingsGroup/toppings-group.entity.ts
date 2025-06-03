import { Ingredient } from 'src/Ingredient/ingredient.entity';
import { Product } from 'src/Product/product.entity';
import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity({ name: 'toppings_groups' })
export class ToppingsGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string; // Ej: "Salsas dulces", "Toppings premium"

  @Column({ default: true })
  isActive: boolean;

  // ------------------------  Relaciones --------------
  @ManyToMany(() => Ingredient)
  @JoinTable({
    name: 'toppings_groups_ingredients',
    joinColumn: { name: 'toppings_group_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'ingredient_id', referencedColumnName: 'id' },
  })
  toppings: Ingredient[];

  @ManyToMany(() => Product, (product) => product.availableToppingsGroups)
  products: Product[];
}
