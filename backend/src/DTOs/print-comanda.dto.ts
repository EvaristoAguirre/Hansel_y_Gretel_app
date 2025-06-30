import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class PrintComandaDTO {
  @IsString()
  table: string;

  @IsArray()
  @Type(() => Details)
  products: Details[];

  @IsNumber()
  @IsOptional()
  numberCustomers?: number;

  @IsOptional()
  @IsBoolean()
  isPriority?: boolean;
}

class Details {
  @IsString()
  name: string;

  @IsString()
  quantity: number;

  @IsArray()
  toppings?: string[];

  @IsString()
  @IsOptional()
  commentOfProduct?: string;
}
