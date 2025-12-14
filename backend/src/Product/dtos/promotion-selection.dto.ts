import { IsArray, IsOptional, IsUUID } from 'class-validator';

export class PromotionSelectionDto {
  @IsUUID()
  slotId: string;

  @IsUUID()
  selectedProductId: string;

  @IsOptional()
  @IsArray()
  toppingsPerUnit?: string[][];
}
