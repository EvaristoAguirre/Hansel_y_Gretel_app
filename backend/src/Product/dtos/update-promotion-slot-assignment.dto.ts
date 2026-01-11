import { IsBoolean, IsNumber, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdatePromotionSlotAssignmentDto {
  @ApiProperty({
    description: 'Cantidad de este slot en la promoción',
    example: 2,
    required: false,
    minimum: 1,
  })
  @IsNumber()
  @IsOptional()
  @Min(1)
  quantity?: number;

  @ApiProperty({
    description: 'Indica si el cliente puede omitir este slot al ordenar',
    example: true,
    required: false,
  })
  @IsBoolean()
  @IsOptional()
  isOptional?: boolean;
}

