import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

export class CreateUnitOfMeasureDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  abbreviation?: string;

  @IsBoolean()
  isActive: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  equivalenceToBaseUnit?: number;

  @IsOptional()
  @IsString()
  baseUnitId?: string;

  @IsBoolean()
  isConventional: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateUnitConversionDto)
  conversions?: CreateUnitConversionDto[];
}

export class CreateUnitConversionDto {
  @IsString()
  toUnitId: string;

  @IsNumber()
  @Min(0)
  conversionFactor: number;
}
