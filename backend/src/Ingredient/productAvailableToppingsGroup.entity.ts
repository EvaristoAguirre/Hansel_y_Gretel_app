import { Product } from 'src/Product/entities/product.entity';
import { UnitOfMeasure } from 'src/UnitOfMeasure/unitOfMesure.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { ToppingsGroup } from 'src/ToppingsGroup/toppings-group.entity';

@Entity({ name: 'product_available_topping_groups' })
export class ProductAvailableToppingGroup {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  quantityOfTopping: number;

  @Column({ type: 'jsonb', nullable: true })
  settings?: {
    maxSelection?: number;
    chargeExtra?: boolean;
    extraCost?: number;
  };

  // ------------------------  Relaciones --------------
  @ManyToOne(
    () => UnitOfMeasure,
    (unitOfMeasure) => unitOfMeasure.ProductAvailableToppingGroup,
  )
  @JoinColumn({ name: 'unitOfMeasureId' })
  unitOfMeasure: UnitOfMeasure;

  @ManyToOne(() => Product, (product) => product.availableToppingGroups, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'productId' })
  product: Product;
  @Column({ name: 'productId' })
  productId: string;

  @ManyToOne(() => ToppingsGroup, (group) => group.productsAvailableIn, {
    eager: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'toppingGroupId' })
  toppingGroup: ToppingsGroup;
}
