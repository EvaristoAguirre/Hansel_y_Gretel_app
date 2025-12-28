import { IsOptional, IsString, IsUUID, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePromotionSlotDto {
  @ApiProperty({
    description:
      'ID de la promoción a la que pertenece este slot (opcional - puede asignarse después)',
    example: '123e4567-e89b-12d3-a456-426614174000',
    type: String,
    format: 'uuid',
    required: false,
  })
  @IsUUID()
  @IsOptional()
  promotionId?: string;

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
}
