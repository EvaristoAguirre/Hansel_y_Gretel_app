import { IsNumber, IsString } from 'class-validator';

export class DeductStockDto {
  @IsString()
  productId: string;
  @IsNumber()
  quantity: number;
}
