import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class OrderDetailsDto {
  @IsString()
  productId: string;

  @IsOptional()
  @IsArray()
  toppingsPerUnit?: string[][];

  @IsNumber()
  quantity: number;

  @IsString()
  @IsOptional()
  commentOfProduct?: string;
}
