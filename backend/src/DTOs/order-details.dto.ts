import { IsNumber, IsString } from 'class-validator';

export class OrderDetailsDto {
  @IsString()
  productId: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  unitaryPrice: number;
}
