import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateOrderDto {
  @ApiProperty({
    description: 'UUID de la mesa donde se abre el pedido',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsNotEmpty()
  @IsString()
  tableId: string;

  @ApiProperty({
    description: 'Número de comensales en la mesa',
    example: 4,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  numberCustomers: number;

  @ApiPropertyOptional({
    description: 'Comentario o nota adicional del pedido',
    example: 'Cliente frecuente - Mesa VIP',
  })
  @IsOptional()
  @IsString()
  comment?: string;
}
