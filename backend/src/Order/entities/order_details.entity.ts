import { Product } from 'src/Product/entities/product.entity';
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
import { OrderDetailToppings } from './order_details_toppings.entity';
import { OrderPromotionSelection } from './order-promotion-selection.entity';

@Entity({ name: 'order_details' })
export class OrderDetails {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  quantity: number;

  @Column('decimal', { precision: 10, scale: 2 })
  unitaryPrice: number;

  @Column('decimal', { precision: 10, scale: 2, default: 0 })
  toppingsExtraCost: number;

  @Column('decimal', { precision: 10, scale: 2 })
  subtotal: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ nullable: true })
  commentOfProduct: string;

  @Column({ type: 'varchar', length: 40, nullable: true })
  commandNumber: string;

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

  @OneToMany(() => OrderDetailToppings, (topping) => topping.orderDetails, {
    cascade: true,
  })
  orderDetailToppings: OrderDetailToppings[];

  @OneToMany(
    () => OrderPromotionSelection,
    (selection) => selection.orderDetail,
    {
      cascade: true,
    },
  )
  promotionSelections: OrderPromotionSelection[];
}
