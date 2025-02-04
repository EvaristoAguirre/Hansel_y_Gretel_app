import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
// import { OrderDetailsDto } from './order-details.dto';

export class CreateOrderDto {
  @IsNotEmpty()
  @IsString()
  tableId: string;

  @IsNotEmpty()
  @IsNumber()
  numberCustomers: number;

  // @IsNotEmpty()
  // @IsArray()
  // productsDetails?: OrderDetailsDto[];

  @IsOptional()
  @IsString()
  comment?: string;
}
