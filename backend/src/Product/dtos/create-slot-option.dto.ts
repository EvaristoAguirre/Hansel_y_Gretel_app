import { IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateSlotOptionDto {
  @ApiProperty({
    description: 'ID del slot al que pertenece esta opción',
    example: '123e4567-e89b-12d3-a456-426614174001',
    type: String,
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  slotId: string;

  @ApiProperty({
    description: 'ID del producto que representa esta opción',
    example: '123e4567-e89b-12d3-a456-426614174100',
    type: String,
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description:
      'Costo adicional al precio base de la promoción si se elige esta opción',
    example: 500,
    minimum: 0,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  extraCost: number;
}
