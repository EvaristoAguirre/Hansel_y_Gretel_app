import { IsOptional, IsString } from 'class-validator';

export class PrintComandaDTO {
  @IsString()
  @IsOptional()
  name: string;
  @IsString()
  @IsOptional()
  description: string;
  @IsString()
  @IsOptional()
  price: number;
  @IsString()
  @IsOptional()
  quantity: number;
}
