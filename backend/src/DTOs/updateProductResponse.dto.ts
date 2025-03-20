import { Expose, Type } from 'class-transformer';
import {
  CategoryResponseDto,
  IngredientResponseDto,
  UnitOfMeasureResponseDto,
} from './CategoryIngredientUnit.dto';

export class UpdteProductResponseDto {
  @Expose()
  id: string;

  @Expose()
  code: number;

  @Expose()
  name: string;

  @Expose()
  description: string;

  @Expose()
  price: string;

  @Expose()
  cost: string;

  @Expose()
  isActive: boolean;

  @Expose()
  @Type(() => CategoryResponseDto)
  categories: CategoryResponseDto[];

  @Expose()
  @Type(() => ProductIngredientResponseDto)
  productIngredients: ProductIngredientResponseDto[];
}

export class ProductIngredientResponseDto {
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
