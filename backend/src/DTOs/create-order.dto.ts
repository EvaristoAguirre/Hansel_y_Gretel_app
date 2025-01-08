import { IsArray, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { OrderDetailsDto } from './order-details.dto';

export class CreateOrderDto {
  @IsNotEmpty()
  @IsString()
  tableId: string;

  @IsNumber()
  numberCustomers: number;

  @IsNotEmpty()
  @IsArray()
  productsDetails: OrderDetailsDto[];
}
