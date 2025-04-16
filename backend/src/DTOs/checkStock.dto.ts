import { IsInt, IsString, IsUUID, Min } from 'class-validator';

export class CheckStockDto {
  @IsString()
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(0)
  quantityToSell: number;
}
