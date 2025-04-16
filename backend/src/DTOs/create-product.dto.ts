import {
  IsInt,
  Max,
  Min,
  IsOptional,
  IsString,
  IsArray,
  IsUUID,
  IsNumber,
  IsNotEmpty,
  ValidateNested,
  IsEnum,
} from 'class-validator';
import { ProductIngredientDto } from './productIngredient.dto';
import { Transform, Type } from 'class-transformer';
import { PromotionProductDto } from './create-promotion.dto';

export class CreateProductDto {
  @IsNotEmpty({ message: 'El nombre del producto es obligatorio' })
  @IsString()
  @Transform(({ value }) => value.toLowerCase())
  name: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(9999)
  code?: number;

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
  @IsUUID('all', { each: true })
  categories?: string[];

  @IsOptional()
  @IsString()
  providerId?: string;

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
