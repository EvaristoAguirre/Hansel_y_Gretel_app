import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateIngredientDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => value.toLowerCase())
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  cost?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsString()
  @IsOptional()
  unitOfMeasureId?: string;

  // Campo requerido por la entidad
  @IsEnum(['masa', 'volumen', 'unidad'])
  @IsOptional()
  type: 'masa' | 'volumen' | 'unidad';

  // Campos opcionales que el frontend puede enviar
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => value === true || value === 'true')
  isTopping?: boolean;

  @IsNumber()
  @Min(0)
  @IsOptional()
  @Transform(({ value }) =>
    value === null || value === undefined ? undefined : Number(value),
  )
  extraCost?: number;
}
