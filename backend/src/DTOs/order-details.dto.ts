import { Type } from 'class-transformer';
import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';

export class OrderDetailsDto {
  @IsString()
  productId: string;

  @IsOptional()
  @IsArray()
  toppingsPerUnit?: string[][];

  @IsNumber()
  quantity: number;

  @IsString()
  @IsOptional()
  commentOfProduct?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PromotionSelectionDto)
  promotionSelections?: PromotionSelectionDto[]; // ← NUEVO
}

export class PromotionSelectionDto {
  @IsUUID()
  slotId: string;

  @IsUUID()
  selectedProductId: string;

  @IsOptional()
  @IsArray()
  toppingsPerUnit?: string[][]; // Si el producto seleccionado tiene toppings
}
