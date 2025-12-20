import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePromotionSlotDto {
  @ApiProperty({
    description: 'Nombre descriptivo del slot',
    example: 'Torta Premium',
    required: false,
    maxLength: 100,
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({
    description: 'Descripción opcional del slot',
    example: 'Selecciona tu torta premium favorita',
    required: false,
    maxLength: 255,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Cantidad de productos de este slot incluidos en la promoción',
    example: 2,
    required: false,
    minimum: 1,
  })
  @IsNumber()
  @IsOptional()
  quantity?: number;

  @ApiProperty({
    description: 'Orden de visualización del slot en la UI',
    example: 3,
    required: false,
    minimum: 0,
  })
  @IsNumber()
  @IsOptional()
  displayOrder?: number;

  @ApiProperty({
    description: 'Indica si el cliente puede omitir este slot al ordenar',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isOptional?: boolean;

  @ApiProperty({
    description: 'Indica si el slot está activo',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
