import { IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateDailyCashDto {
  @IsString()
  @IsOptional()
  comment: string;

  @IsNumber()
  initialCash: number;
}
