import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

export class CheckStockDto {
  @IsString()
  @IsUUID()
  productId: string;

  @IsOptional()
  @IsArray()
  toppingsPerUnit?: string[];

  @IsInt()
  @Min(0)
  quantityToSell: number;
}
