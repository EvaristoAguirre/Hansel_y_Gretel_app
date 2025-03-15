import { Product } from 'src/Product/product.entity';
import { CategoryResponseDto } from './CategoryIngredientUnit.dto';
import { Type } from 'class-transformer';

export class UnitOfMeasureResponseDto {
  id: string;
  name: string;
  abbreviation: string;
  isActive: boolean;
}
export class IngredientResponseDto {
  id: string;
  name: string;
  description: string;
  cost: number;
  isActive: boolean;
}

export class ProductResponseDto {
  id: string;
  code?: number;
  name?: string;
  description?: string;
  price?: number;
  cost?: number;
  isActive?: boolean;
  type: 'product' | 'promotion';
  categories?: CategoryResponseDto[];
  productIngredients?: ProductIngredientsResponseDto[];
  promotionProducts?: [
    {
      id: string;
      quantity: number;
      product: Product;
    },
  ];
}

export class ProductIngredientsResponseDto {
  id: string;
  quantityOfIngredient: number;
  @Type(() => IngredientResponseDto)
  ingredient: IngredientResponseDto;
  @Type(() => UnitOfMeasureResponseDto)
  unitOfMeasure: UnitOfMeasureResponseDto;
}
