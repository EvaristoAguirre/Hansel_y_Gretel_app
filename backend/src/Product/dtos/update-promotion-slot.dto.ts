import { IsBoolean, IsOptional, IsString } from 'class-validator';
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
    description: 'Indica si el slot está activo',
    example: false,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
