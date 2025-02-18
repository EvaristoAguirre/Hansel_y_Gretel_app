import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { OrderState } from 'src/Enums/states.enum';
import { OrderDetailsDto } from './order-details.dto';

export class UpdateOrderDto {
  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsString()
  tableId?: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsEnum({ enum: OrderState })
  state?: OrderState;

  @IsOptional() //esto esta de mas
  @IsString()
  table?: string;

  @IsOptional()
  @IsNumber()
  numberCustomers?: number;

  @IsOptional()
  @IsString()
  comment?: string;

  @IsOptional()
  @IsArray()
  productsDetails?: OrderDetailsDto[];
}
