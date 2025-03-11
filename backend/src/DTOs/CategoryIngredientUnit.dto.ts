import { Expose } from 'class-transformer';

export class CategoryResponseDto {
  @Expose()
  id: string;

  @Expose()
  name: string;

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
  price: string;

  @Expose()
  cost: string;

  @Expose()
  isActive: boolean;
}

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
