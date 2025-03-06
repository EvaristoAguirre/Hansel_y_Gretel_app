import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateUnitOfMeasureDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
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
