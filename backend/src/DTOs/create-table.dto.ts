import { IsOptional, IsString } from 'class-validator';

export class CreateTableDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsString()
  roomId: string;
}
