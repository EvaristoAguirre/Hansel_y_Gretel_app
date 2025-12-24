import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
  ValidateNested,
} from 'class-validator';

/**
 * DTO para actualizar una opción de slot dentro de una actualización de promoción
 */
export class UpdateSlotOptionForUpdateDto {
  @IsUUID()
  @IsOptional()
  id?: string; // Si tiene ID, es una opción existente. Si no, es nueva.

  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @IsBoolean()
  @IsNotEmpty()
  isDefault: boolean;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  extraCost: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  displayOrder: number;
}

/**
 * DTO para actualizar un slot con sus opciones dentro de una actualización de promoción
 */
export class UpdatePromotionSlotWithOptionsDto {
  @IsUUID()
  @IsOptional()
  id?: string; // Si tiene ID, es un slot existente. Si no, es nuevo.

  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  quantity: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  displayOrder: number;

  @IsBoolean()
  @IsNotEmpty()
  isOptional: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateSlotOptionForUpdateDto)
  options: UpdateSlotOptionForUpdateDto[];
}
