import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Nombre de la categoría',
    example: 'Bebidas Calientes',
  })
  @IsNotEmpty()
  @IsString()
  name: string;
}
