import {
  IsOptional,
  IsInt,
  Max,
  Min,
  IsString,
  IsArray,
  IsUUID,
  IsNumber,
  IsBoolean,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { ProductIngredientDto } from './productIngredient.dto';
import { Type } from 'class-transformer';
import { PromotionProductDto } from './create-promotion.dto';

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
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cost?: number;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  categories?: string[];

  @IsOptional()
  @IsString()
  providerId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ProductIngredientDto)
  ingredients?: ProductIngredientDto[];

  @IsOptional()
  @IsEnum(['product', 'promotion'])
  type?: 'product' | 'promotion';

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PromotionProductDto)
  products?: PromotionProductDto[];
}
