import { Ingredient } from 'src/Ingredient/ingredient.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { OrderDetails } from './order_details.entity';
import { UnitOfMeasure } from 'src/UnitOfMeasure/unitOfMesure.entity';

@Entity({ name: 'order_detail_toppings' })
export class OrderDetailToppings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 50 })
  unitOfMeasureName: string;

  //--------------- Relaciones ---------------- //

  @ManyToOne(() => OrderDetails, (order) => order.orderDetailToppings)
  orderDetails: OrderDetails;

  @ManyToOne(() => Ingredient)
  topping: Ingredient;

  @ManyToOne(() => UnitOfMeasure)
  unitOfMeasure: UnitOfMeasure;
}
