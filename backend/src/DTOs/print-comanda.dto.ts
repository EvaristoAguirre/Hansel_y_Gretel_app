import { Type } from 'class-transformer';
import { IsArray, IsString } from 'class-validator';

export class PrintComandaDTO {
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
}
