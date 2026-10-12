import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './user.service';
import { RegisterUserDto } from 'src/DTOs/register-user.dto';
import { User } from './user.entity';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { RolesGuard } from 'src/Guards/roles.guard';
import { Roles } from 'src/Decorators/roles.decorator';
import { UserRole } from 'src/Enums/roles.enum';

@ApiTags('Auth')
@Controller('user')
export class UserController {
  constructor(private readonly userService: AuthService) {}

  @Post('register')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Registrar nuevo usuario',
    description:
      'Crea un nuevo usuario. Requiere Admin o Encargado. Encargado no puede crear Admin ni Encargado.',
  })
  @ApiBody({
    type: RegisterUserDto,
    description: 'Datos del usuario a registrar',
    examples: {
      ejemplo: {
        summary: 'Usuario mozo',
        value: {
          username: 'juan_mozo',
          password: 'contraseña123',
          role: 'MOZO',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado exitosamente',
    schema: {
      example: {
        id: 'uuid-generado',
        username: 'juan_mozo',
        role: 'MOZO',
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'El nombre de usuario ya existe',
  })
  @ApiResponse({
    status: 400,
    description: 'Datos de registro inválidos',
  })
  @ApiResponse({
    status: 403,
    description: 'Sin token o sin permiso para registrar',
  })
  async register(
    @Body() dataRegister: RegisterUserDto,
    @Req() req: { user?: { role?: UserRole } },
  ): Promise<Omit<User, 'password'>> {
    const { username, password, role } = dataRegister;
    return await this.userService.register(
      username,
      password,
      role ?? UserRole.MOZO,
      req.user?.role,
    );
  }

  @Post('login')
  @ApiOperation({
    summary: 'Iniciar sesión',
    description:
      'Autentica un usuario y devuelve un token JWT para acceder a los endpoints protegidos.',
  })
  @ApiBody({
    type: RegisterUserDto,
    description: 'Credenciales del usuario',
    examples: {
      ejemplo: {
        summary: 'Login de usuario',
        value: {
          username: 'juan_mozo',
          password: 'contraseña123',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Login exitoso - Devuelve token JWT',
    schema: {
      example: {
        accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Credenciales inválidas',
  })
  @ApiResponse({
    status: 429,
    description: 'Demasiados intentos de login. Intente más tarde.',
  })
  async login(
    @Body() dataLogin: RegisterUserDto,
  ): Promise<{ accessToken: string }> {
    const { username, password } = dataLogin;
    return await this.userService.login(username, password);
  }
}
