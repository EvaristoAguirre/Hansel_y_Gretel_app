import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreatePromotionDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(9999)
  code?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  price?: number;

  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  categories?: string[];

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => PromotionProductDto)
  products?: PromotionProductDto[];
}

export class PromotionProductDto {
  @IsString()
  productId: string;

  @IsNumber()
  quantity: number;
}
