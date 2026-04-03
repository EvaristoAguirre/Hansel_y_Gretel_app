import { ApiProperty } from '@nestjs/swagger';
import { IsInt, IsPositive } from 'class-validator';

export class CancelOrderDetailDto {
  @ApiProperty({
    description:
      'Cantidad de unidades a anular. Debe ser mayor a 0 y no puede superar la cantidad actual del ítem.',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  quantityToCancel: number;
}
