import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class UpdateStockDto {
  @IsNumber()
  @Min(0)
  @IsOptional()
  quantityInStock?: number;

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
