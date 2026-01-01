import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsArray,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';

export class CreatePromotionWithSlotsDto {
  @ApiProperty({
    description: 'Nombre de la promoción (se guarda en minúsculas)',
    example: 'Promo Mendocina',
  })
  @IsNotEmpty({ message: 'El nombre de la promoción es obligatorio' })
  @IsString()
  @Transform(({ value }) => value.toLowerCase())
  name: string;

  @ApiProperty({
    description: 'Código único del producto/promoción (0-9999)',
    example: 101,
    minimum: 0,
    maximum: 9999,
  })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(9999)
  code?: number;

  @ApiPropertyOptional({
    description: 'Descripción de la promoción',
    example: 'Promoción especial de la semana',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Precio de venta al público',
    example: 1500,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @ApiPropertyOptional({
    description: 'UUIDs de las categorías a las que pertenece',
    type: [String],
    example: ['uuid-bebidas', 'uuid-cafeteria'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  categories?: string[];

  @ApiPropertyOptional({
    description: 'Tipo de producto',
    enum: ['product', 'promotion'],
    example: 'product',
  })
  @IsOptional()
  @IsEnum(['product', 'promotion'])
  type?: 'product' | 'promotion';

  @ApiPropertyOptional({
    description: 'UUIDs de los slots que la promoción tendrá',
    type: [String],
    example: ['uuid-slot-1', 'uuid-slot-2'],
  })
  @IsOptional()
  @IsArray()
  @IsUUID('all', { each: true })
  slots?: string[];
}
