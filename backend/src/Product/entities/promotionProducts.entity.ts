import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from './product.entity';

@Entity({ name: 'promotion_products' })
export class PromotionProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product, (product) => product.promotionDetails)
  @JoinColumn({ name: 'promotionId' })
  promotion: Product;

  @ManyToOne(() => Product, (product) => product.componentDetails)
  @JoinColumn({ name: 'productId' })
  product: Product;

  @Column({ type: 'int', nullable: false })
  quantity: number;
}
