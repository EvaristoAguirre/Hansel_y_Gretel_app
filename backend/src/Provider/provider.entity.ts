import { Product } from 'src/Product/product.entity';
import { Column, OneToMany, PrimaryGeneratedColumn } from 'typeorm';

export class Provider {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: false, unique: true })
  name: string;

  @Column({ nullable: true, type: 'decimal' })
  phone: number;

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => Product, (product) => product.provider)
  products: Product[];
}
