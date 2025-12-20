import { IsBoolean, IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator';
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
    description: 'Indica si esta es la opción seleccionada por defecto',
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  isDefault: boolean;

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

  @ApiProperty({
    description: 'Orden de visualización de esta opción en la UI',
    example: 1,
    minimum: 0,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  displayOrder: number;
}
