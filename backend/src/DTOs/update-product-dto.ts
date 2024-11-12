// update-product.dto.ts
import { State } from '../Product/product.entity';
import { IsOptional, IsInt, Max, Min, IsString, IsEnum } from 'class-validator';

export class UpdateProductDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(9999)
  code?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  price?: number;

  @IsOptional()
  cost?: number;

  @IsOptional()
  @IsEnum(State)
  state?: State;
}
