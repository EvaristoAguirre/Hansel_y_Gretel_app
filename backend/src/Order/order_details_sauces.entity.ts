import { Ingredient } from 'src/Ingredient/ingredient.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { OrderDetails } from './order_details.entity';
import { UnitOfMeasure } from 'src/UnitOfMeasure/unitOfMesure.entity';

@Entity({ name: 'order_detail_sauces' })
export class OrderDetailSauce {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantityUsed: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  appliedPrice: number;

  @Column({ type: 'varchar', length: 50 })
  unitOfMeasureName: string;

  //--------------- Relaciones ---------------- //

  @ManyToOne(() => OrderDetails, (order) => order.sauces)
  orderDetails: OrderDetails;

  @ManyToOne(() => Ingredient)
  sauce: Ingredient;

  @ManyToOne(() => UnitOfMeasure)
  unitOfMeasure: UnitOfMeasure;
}
