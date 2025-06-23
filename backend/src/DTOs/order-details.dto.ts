import { IsNumber, IsOptional, IsString } from 'class-validator';

export class OrderDetailsDto {
  @IsString()
  productId: string;

  @IsOptional()
  toppingsIds: string[];

  @IsNumber()
  quantity: number;

  @IsString()
  @IsOptional()
  commentOfProduct?: string;
}
