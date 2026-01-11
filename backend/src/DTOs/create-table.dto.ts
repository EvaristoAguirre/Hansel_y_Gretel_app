import { IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateTableDto {
  @ApiPropertyOptional({
    description: 'Nombre de la mesa',
    example: 'Mesa 1',
  })
  @IsOptional()
  @IsString()
  name: string;

  @ApiProperty({
    description: 'UUID del salón al que pertenece la mesa',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  @IsString()
  roomId: string;
}
