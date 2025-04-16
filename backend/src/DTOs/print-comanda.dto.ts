import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class PrintComandaDTO {
  @IsString()
  table: string;

  @IsArray()
  @Type(() => Details)
  products: Details[];

  @IsNumber()
  @IsOptional()
  numberCustomers?: number;
}

class Details {
  @IsString()
  name: string;
  @IsString()
  quantity: number;
}
