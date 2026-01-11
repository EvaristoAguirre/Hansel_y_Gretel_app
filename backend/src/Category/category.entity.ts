import { Product } from 'src/Product/entities/product.entity';
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'category' })
export class Category {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, unique: true })
  name: string;

  @Column({ default: true, nullable: false })
  isActive: boolean;

  // --------- Relaciones ---------

  @ManyToMany(() => Product, (product) => product.categories)
  products: Product[];
}
