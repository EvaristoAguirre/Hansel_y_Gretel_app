import { CategoryResponseDto } from './CategoryIngredientUnit.dto';
import { Expose, Type } from 'class-transformer';
import { PromotionResponse } from './promotionResponse.dto';

export class UnitOfMeasureResponseDto {
  @Expose()
  id: string;
  @Expose()
  name: string;
  @Expose()
  abbreviation: string;
  @Expose()
  isActive: boolean;
}
export class IngredientResponseDto {
  @Expose()
  id: string;
  @Expose()
  name: string;
  @Expose()
  description: string;
  @Expose()
  cost: number;
  @Expose()
  isActive: boolean;
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
  description?: string;
  @Expose()
  price?: number;
  @Expose()
  cost?: number;
  @Expose()
  isActive?: boolean;
  @Expose()
  type: 'product' | 'promotion';

  @Expose()
  @Type(() => CategoryResponseDto)
  categories?: CategoryResponseDto[];

  @Expose()
  @Type(() => ProductIngredientsResponseDto)
  productIngredients?: ProductIngredientsResponseDto[];

  @Expose()
  @Type(() => PromotionProductResponseDto)
  promotionProducts?: PromotionProductResponseDto[];

  @Expose()
  @Type(() => UnitOfMeasureResponseDto)
  unitOfMeasure: UnitOfMeasureResponseDto;

  @Expose()
  @Type(() => StockSummary)
  stock: StockSummary;
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
