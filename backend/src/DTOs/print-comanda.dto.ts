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

  @IsString()
  @IsOptional()
  commentOfProduct?: string;

  @IsOptional()
  @IsBoolean()
  isPriority?: boolean;
}

class Details {
  @IsString()
  name: string;
  @IsString()
  quantity: number;

  @IsString()
  @IsOptional()
  commentOfProduct?: string;
}
