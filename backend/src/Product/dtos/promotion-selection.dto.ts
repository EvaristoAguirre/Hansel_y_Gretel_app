import { IsArray, IsOptional, IsUUID, ArrayMinSize } from 'class-validator';

export class PromotionSelectionDto {
  @IsUUID()
  slotId: string;

  @IsArray()
  @IsUUID(undefined, { each: true })
  @ArrayMinSize(1)
  selectedProductIds: string[]; // Array de productos seleccionados (puede incluir duplicados)

  @IsOptional()
  @IsArray()
  toppingsPerUnit?: string[][]; // Array de toppings, uno por cada producto seleccionado
}
