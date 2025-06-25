import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class OrderDetailsDto {
  @IsString()
  productId: string;

  @IsOptional()
  @IsArray()
  @IsArray({ each: true })
  @IsString({ each: true })
  toppingsPerUnit?: string[][];

  @IsNumber()
  quantity: number;

  @IsString()
  @IsOptional()
  commentOfProduct?: string;
}
