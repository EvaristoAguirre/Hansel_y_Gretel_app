import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class CreateTableDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsNumber()
  number: number;

  @IsOptional()
  @IsString()
  coment?: string;

  @IsString()
  roomId: string;

  @IsNumber()
  @Min(1)
  @Max(100)
  numberCustomers: number;
}
