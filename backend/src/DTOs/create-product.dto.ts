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
} from 'class-validator';
import { ProductIngredientDto } from './productIngredient.dto';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(9999)
  code?: number;

  @IsNotEmpty({ message: 'El nombre del producto es obligatorio' })
  @IsString()
  name: string;

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
}
