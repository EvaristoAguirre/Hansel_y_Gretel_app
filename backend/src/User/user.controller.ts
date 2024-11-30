import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { UserRole } from './user.entity';

@Controller('mozos')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post('register')
  async register(
    @Body('username') username: string,
    @Body('password') password: string,
    @Body('role') role: UserRole = UserRole.MOZO,
  ) {
    return this.userService.register(username, password, role);
  }

  @Post('login')
  async login(
    @Body('username') username: string,
    @Body('password') password: string,
  ) {
    const user = await this.userService.validateUser(username, password);
    // Generar un token o sesión
    return {
      message: 'Inicio de sesión exitoso',
      username: user.username,
      role: user.role,
    };
  }

  @Post('recover')
  async recover(@Body('username') username: string) {
    const recoveryCode = await this.userService.generateRecoveryCode(username);
    return { message: 'Código de recuperación generado', recoveryCode };
  }

  @Post('reset-password')
  async resetPassword(
    @Body('username') username: string,
    @Body('recoveryCode') recoveryCode: string,
    @Body('newPassword') newPassword: string,
  ) {
    await this.userService.resetPassword(username, recoveryCode, newPassword);
    return { message: 'Contraseña actualizada exitosamente' };
  }
}
