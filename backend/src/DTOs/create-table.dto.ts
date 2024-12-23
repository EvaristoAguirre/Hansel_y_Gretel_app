import { IsNumber, IsOptional, IsString } from 'class-validator';

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
}
