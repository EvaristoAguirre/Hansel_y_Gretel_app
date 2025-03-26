import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class CreateUnitOfMeasureDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  abbreviation?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  equivalenceToBaseUnit?: number;

  @IsOptional()
  @IsString()
  baseUnitId?: string;

  @IsOptional()
  @IsBoolean()
  isConventional?: boolean;

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

export class CreateEspecialUnitOfMeasureDto {
  @IsString()
  @MinLength(1)
  name: string;

  @IsString()
  @IsOptional()
  abbreviation?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateUnitConversionDto)
  @IsOptional()
  conversions?: CreateUnitConversionDto[];
}
