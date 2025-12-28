import {
  IsOptional,
  IsString,
  IsUUID,
  IsNotEmpty,
  IsArray,
  ArrayMinSize,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePromotionSlotDto {
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
    description: 'IDs de los productos que serán parte del slot',
    example: ['uuid-producto-1', 'uuid-producto-2'],
    required: false,
  })
  @IsArray()
  @IsUUID('all', { each: true })
  @ArrayMinSize(1)
  @IsOptional()
  productIds?: string[];
}
