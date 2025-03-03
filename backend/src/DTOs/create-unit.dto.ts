import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateUnitOfMeasureDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  abbreviation?: string;

  @IsNumber()
  @IsOptional()
  equivalenceToBaseUnit?: number;

  @IsString()
  @IsOptional()
  baseUnitId?: string;
}
