import { IsDecimal, IsInt, IsNumber, IsOptional, Max, Min } from 'class-validator';
import { Category } from 'src/Category/category.entity';
import { OrderDetails } from 'src/Order/order_details.entity';
import { Provider } from 'src/Provider/provider.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  ManyToOne,
  OneToMany,
} from 'typeorm';

@Entity({ name: 'products' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', nullable: true, unique: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(9999)
  code: number;

  @Column({ nullable: false, unique: true })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  @IsNumber()
  @Min(0)
  price: number;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  @IsNumber()
  @Min(0)
  cost: number;

  @Column({ default: true })
  isActive: boolean;

  // ---------       Relaciones   -----------

  @ManyToMany(() => Category, (category) => category.products, {
    cascade: true,
  })
  @JoinTable({ name: 'product_categories' })
  categories: Category[];

  @ManyToOne(() => Provider, (provider) => provider.products, {
    nullable: true,
  })
  provider: Provider;

  @OneToMany(() => OrderDetails, (orderDetails) => orderDetails.product)
  orderDetails: OrderDetails[];
}
