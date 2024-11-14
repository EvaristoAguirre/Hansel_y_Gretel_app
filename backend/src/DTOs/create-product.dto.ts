// create-product.dto.ts
import { State } from '../Product/product.entity';
import {
  IsInt,
  Max,
  Min,
  IsOptional,
  IsString,
  IsEnum,
  IsArray,
  ArrayNotEmpty,
  IsUUID,
} from 'class-validator';

export class CreateProductDto {
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(9999)
  code?: number;

  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  price?: number;

  @IsOptional()
  cost?: number;

  @IsEnum(State)
  @IsOptional()
  state?: State;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  @IsUUID('all', { each: true })
  categories?: string[];
}
