import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './user.service';
import { RegisterUserDto } from 'src/DTOs/register-user.dto';
import { User } from './user.entity';

@Controller('user')
export class UserController {
  constructor(private readonly userService: AuthService) {}

  @Post('register')
  async register(@Body() dataRegister: RegisterUserDto): Promise<User> {
    const { username, password, role } = dataRegister;
    return await this.userService.register(username, password, role);
  }

  @Post('login')
  async login(
    @Body() dataLogin: RegisterUserDto,
  ): Promise<{ accessToken: string }> {
    const { username, password } = dataLogin;
    return await this.userService.login(username, password);
  }
}
