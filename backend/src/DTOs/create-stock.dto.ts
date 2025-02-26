import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateStockDto {
  @IsNumber()
  @Min(0)
  quantityInStock: number;

  @IsNumber()
  @Min(0)
  minimumStock: number;

  @IsOptional()
  @IsString()
  productId?: string;

  @IsOptional()
  @IsString()
  ingredientId?: string;
}
