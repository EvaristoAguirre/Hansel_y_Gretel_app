import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePromotionSlotDto {
  @ApiProperty({
    description: 'ID de la promoción a la que pertenece este slot',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  promotionId: string;

  @ApiProperty({
    description: 'Nombre descriptivo del slot',
    example: 'Torta',
    minLength: 1,
    maxLength: 100,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Descripción opcional del slot',
    example: 'Selecciona tu torta favorita',
    required: false,
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Cantidad de productos de este slot incluidos en la promoción',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  quantity: number;

  @ApiProperty({
    description: 'Orden de visualización del slot en la UI',
    example: 1,
    minimum: 0,
  })
  @IsNumber()
  @IsNotEmpty()
  displayOrder: number;

  @ApiProperty({
    description: 'Indica si el cliente puede omitir este slot al ordenar',
    example: false,
  })
  @IsBoolean()
  @IsNotEmpty()
  isOptional: boolean;
}
