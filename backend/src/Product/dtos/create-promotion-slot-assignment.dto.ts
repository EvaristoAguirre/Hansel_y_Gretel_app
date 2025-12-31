import { IsBoolean, IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePromotionSlotAssignmentDto {
  @ApiProperty({
    description: 'ID del slot a asignar a la promoción',
    example: '123e4567-e89b-12d3-a456-426614174001',
    type: String,
    format: 'uuid',
  })
  @IsUUID()
  @IsNotEmpty()
  slotId: string;

  @ApiProperty({
    description: 'Cantidad de este slot en la promoción',
    example: 1,
    minimum: 1,
  })
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Indica si el cliente puede omitir este slot al ordenar',
    example: false,
  })
  @IsBoolean()
  @IsNotEmpty()
  isOptional: boolean;
}
