import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateDailyCashDto {
  @IsString()
  @IsOptional()
  comment: string;

  @IsInt()
  totalCash: number;
}
