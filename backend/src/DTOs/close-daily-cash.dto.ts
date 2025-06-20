import { IsInt, IsOptional, IsString } from 'class-validator';

export class CloseDailyCash {
  @IsString()
  @IsOptional()
  comment: string;

  @IsInt()
  totalCash: number;
}
