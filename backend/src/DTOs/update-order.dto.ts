import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { OrderState } from 'src/Enums/states.enum';

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

  @IsOptional()
  @IsString()
  table: string;

  @IsOptional()
  @IsArray()
  orderDetails: string[];
}
