import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

export class UpdateUnitOfMeasureDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  abbreviation?: string;

  @IsNumber()
  @IsOptional()
  equivalenceToBaseUnit?: number;

  @IsString()
  @IsOptional()
  baseUnitId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateUnitConversionDto)
  conversions?: CreateUnitConversionDto[];
}

export class CreateUnitConversionDto {
  @IsUUID()
  toUnitId: string;

  @IsNumber()
  @Min(0.0001)
  conversionFactor: number;
}
