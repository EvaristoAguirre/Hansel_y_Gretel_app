import { Type } from 'class-transformer';
import { IsArray, IsString } from 'class-validator';

export class PrintTicketDTO {
  @IsString()
  table: string;

  @IsArray()
  @Type(() => Details)
  products: Details[];
}

class Details {
  @IsString()
  name: string;
  @IsString()
  quantity: number;
  @IsString()
  price: string;
}
