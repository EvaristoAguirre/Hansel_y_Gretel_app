import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateUnitOfMeasureDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  abbreviation: string;
}
