import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CloseDailyCash {
  @IsString()
  @IsOptional()
  comment: string;

  @IsNumber()
  totalCash: number;
}
