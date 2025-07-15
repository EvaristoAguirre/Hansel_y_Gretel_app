import { CategoryResponseDto } from './CategoryIngredientUnit.dto';
import { Expose, Type } from 'class-transformer';
import { PromotionResponse } from './promotionResponse.dto';

// ----------------------------------------------------- lo sacado de master en github --------
export class UnitOfMeasureResponseDto {
  @Expose()
  id: string;
  @Expose()
  name: string;
  @Expose()
  abbreviation: string;
}
export class IngredientResponseDto {
  @Expose()
  id: string;
  @Expose()
  name: string;

  @Expose()
  cost: number;

  @Expose()
  type: string;
}

export class StockSummary {
  @Expose()
  id: string;
  @Expose()
  quantityInStock: number;
  @Expose()
  minimumStock: number;
  @Expose()
  @Type(() => UnitOfMeasureResponseDto)
  unitOfMeasure: UnitOfMeasureResponseDto;
}

export class ProductResponseDto {
  @Expose()
  id: string;

  @Expose()
  code?: number;

  @Expose()
  name?: string;

  @Expose()
  price?: number;

  @Expose()
  cost?: number;

  @Expose()
  baseCost?: number;

  @Expose()
  type: 'product' | 'promotion' | 'simple';

  @Expose()
  allowsToppings?: boolean;

  @Expose()
  @Type(() => CategoryResponseDto)
  categories?: CategoryResponseDto[];

  @Expose()
  @Type(() => ProductIngredientsResponseDto)
  productIngredients?: ProductIngredientsResponseDto[];

  @Expose()
  @Type(() => PromotionProductResponseDto)
  promotionDetails?: PromotionProductResponseDto[];

  @Expose()
  @Type(() => UnitOfMeasureResponseDto)
  unitOfMeasure: UnitOfMeasureResponseDto;

  @Expose()
  @Type(() => StockSummary)
  stock: StockSummary;

  @Expose()
  @Type(() => AvailableToppingGroupDto)
  availableToppingGroups?: AvailableToppingGroupDto[];
}

export class ProductIngredientsResponseDto {
  @Expose()
  id: string;

  @Expose()
  quantityOfIngredient: number;

  @Expose()
  @Type(() => IngredientResponseDto)
  ingredient: IngredientResponseDto;

  @Expose()
  @Type(() => UnitOfMeasureResponseDto)
  unitOfMeasure: UnitOfMeasureResponseDto;
}

export class PromotionProductResponseDto {
  @Expose()
  id: string;

  @Expose()
  quantity: number;

  @Expose()
  @Type(() => ProductResponseDto)
  product: ProductResponseDto;

  @Expose()
  @Type(() => PromotionResponse)
  promotion: PromotionResponse;
}
export class AvailableToppingGroupDto {
  @Expose()
  id?: string;

  @Expose()
  name?: string;

  @Expose()
  settings: {
    maxSelection?: number;
    chargeExtra?: boolean;
    extraCost?: number;
  };

  @Expose()
  quantityOfTopping: number;

  @Expose()
  toppings: ToppingResponseDto[];
}

export class ToppingGroupResponseDto {
  @Expose()
  id?: string;

  @Expose()
  name?: string;

  @Expose()
  toppings?: ToppingResponseDto[];
}

export class ToppingResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;
}
