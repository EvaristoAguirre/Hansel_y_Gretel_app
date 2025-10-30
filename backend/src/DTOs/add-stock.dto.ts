import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class AddStockDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  quantityToAdd?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  minimumStock?: number;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  ingredientId?: string;

  @IsOptional()
  @IsString()
  unitOfMeasureId?: string;
}
