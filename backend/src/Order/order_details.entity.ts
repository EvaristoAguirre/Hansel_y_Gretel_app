import { Product } from 'src/Product/product.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Order } from './order.entity';

@Entity({ name: 'order_details' })
export class OrderDetails {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitaryPrice: number;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @Column({ default: true })
  isActive: boolean;

  @ManyToOne(() => Product, (product) => product.orderDetails)
  product: Product;

  @ManyToOne(() => Order, (order) => order.orderDetails, {
    onDelete: 'CASCADE',
  })
  order: Order;
}
