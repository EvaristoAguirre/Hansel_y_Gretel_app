import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import * as bcrypt from 'bcrypt';
// import { v4 as uuid } from 'uuid';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async register(
    username: string,
    password: string,
    role: UserRole = UserRole.MOZO,
  ): Promise<User> {
    const existingUser = await this.userRepository.findOne({
      where: { username },
    });
    if (existingUser) {
      throw new Error('El usuario ya existe');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = this.userRepository.create({ username, passwordHash, role });
    return this.userRepository.save(user);
  }

  async validateUser(username: string, password: string): Promise<User> {
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user) throw new UnauthorizedException('Credenciales inválidas');

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid)
      throw new UnauthorizedException('Credenciales inválidas');

    return user;
  }

  async generateRecoveryCode(username: string): Promise<string> {
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    const recoveryCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.recoveryCode = recoveryCode;
    user.recoveryCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    await this.userRepository.save(user);
    return recoveryCode;
  }

  async resetPassword(
    username: string,
    recoveryCode: string,
    newPassword: string,
  ): Promise<void> {
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user) throw new NotFoundException('Usuario no encontrado');

    if (
      user.recoveryCode !== recoveryCode ||
      new Date() > user.recoveryCodeExpires
    ) {
      throw new UnauthorizedException(
        'Código de recuperación inválido o expirado',
      );
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    user.recoveryCode = null;
    user.recoveryCodeExpires = null;

    await this.userRepository.save(user);
  }
}
