import { Product } from 'src/Product/product.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  RelationId,
} from 'typeorm';
import { Order } from './order.entity';
import { Exclude } from 'class-transformer';
import { OrderDetailSauce } from './order_details_sauces.entity';

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

  @Column({ nullable: true })
  commentOfProduct: string;

  //--------------- Relaciones ---------------- //

  @ManyToOne(() => Product, (product) => product.orderDetails)
  product: Product;

  @ManyToOne(() => Order, (order) => order.orderDetails, {
    onDelete: 'CASCADE',
  })
  @Exclude()
  order: Order;

  @RelationId((orderDetails: OrderDetails) => orderDetails.order)
  orderId: string;

  @OneToMany(() => OrderDetailSauce, (sauce) => sauce.orderDetails, {
    cascade: true,
  })
  sauces: OrderDetailSauce[];
}
