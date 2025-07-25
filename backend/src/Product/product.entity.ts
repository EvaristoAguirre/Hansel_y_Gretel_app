import { IsOptional, Max, Min, IsNumber } from 'class-validator';
import { Category } from 'src/Category/category.entity';
import { ProductIngredient } from 'src/Ingredient/ingredientProduct.entity';
import { OrderDetails } from 'src/Order/order_details.entity';
import { Stock } from 'src/Stock/stock.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToMany,
  JoinTable,
  ManyToOne,
  OneToMany,
  OneToOne,
  Index,
} from 'typeorm';
import { PromotionProduct } from './promotionProducts.entity';
import { UnitOfMeasure } from 'src/UnitOfMeasure/unitOfMesure.entity';
import { ProductAvailableToppingGroup } from 'src/Ingredient/productAvailableToppingsGroup.entity';

@Entity({ name: 'products' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'int', nullable: true, unique: true })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(9999)
  code?: number;

  @Column({ nullable: false, unique: true })
  @Index({ unique: true })
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

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @Min(0)
  baseCost: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  @IsNumber()
  @Min(0)
  toppingsCost: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'enum', enum: ['product', 'promotion', 'simple'] })
  type: 'product' | 'promotion' | 'simple';

  @Column({ default: false })
  allowsToppings: boolean; // Determina si el producto acepta salsas

  @Column({ type: 'json', nullable: true })
  toppingsSettings?: {
    maxSelection: number; // Máximo de salsas elegibles (ej: 3)
    isOptional: boolean; // Si es obligatorio elegir al menos 1
    chargeExtra: boolean; // Si las salsas tienen costo adicional
  };

  // ---------       Relaciones   -----------

  @ManyToMany(() => Category, (category) => category.products, {
    cascade: true,
  })
  @JoinTable({ name: 'product_categories' })
  categories: Category[];

  @OneToMany(() => OrderDetails, (orderDetails) => orderDetails.product)
  orderDetails: OrderDetails[];

  @OneToOne(() => Stock, (stock) => stock.product)
  stock: Stock;

  @OneToMany(
    () => ProductIngredient,
    (productIngredient) => productIngredient.product,
  )
  productIngredients: ProductIngredient[];

  @OneToMany(
    () => PromotionProduct,
    (promotionProduct) => promotionProduct.promotion,
  )
  promotionDetails: PromotionProduct[];

  @OneToMany(
    () => PromotionProduct,
    (promotionProduct) => promotionProduct.product,
  )
  componentDetails: PromotionProduct[];

  @ManyToOne(() => UnitOfMeasure, (unitOfMeasure) => unitOfMeasure.products, {
    nullable: true,
  })
  unitOfMeasure: UnitOfMeasure;

  // @ManyToMany(() => ToppingsGroup, (group) => group.products)
  // availableToppingsGroups: ToppingsGroup[];

  @OneToMany(
    () => ProductAvailableToppingGroup,
    (availableTopping) => availableTopping.product,
  )
  availableToppingGroups: ProductAvailableToppingGroup[];
}
