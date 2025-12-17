import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserRole } from 'src/Enums/roles.enum';

export class RegisterUserDto {
  @ApiProperty({
    description: 'Nombre de usuario único',
    example: 'juan_mozo',
    minLength: 3,
  })
  @IsNotEmpty()
  @IsString()
  username: string;

  @ApiProperty({
    description: 'Contraseña del usuario',
    example: 'contraseña123',
    minLength: 6,
  })
  @IsNotEmpty()
  @IsString()
  password: string;

  @ApiPropertyOptional({
    description: 'Rol del usuario en el sistema',
    enum: UserRole,
    example: UserRole.MOZO,
    default: UserRole.MOZO,
  })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}
