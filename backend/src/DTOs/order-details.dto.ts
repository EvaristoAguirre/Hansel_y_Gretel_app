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

  @IsArray()
  @IsUUID(undefined, { each: true })
  selectedProductIds: string[]; // Array de productos seleccionados (puede incluir duplicados)

  @IsOptional()
  @IsArray()
  toppingsPerUnit?: string[][]; // Array de toppings, uno por cada producto seleccionado
}
