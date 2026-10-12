import {
  Injectable,
  ConflictException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcryptjs';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from 'src/Enums/roles.enum';
import { LoggerService } from 'src/Monitoring/monitoring-logger.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
    private readonly monitoringLogger: LoggerService,
  ) {}

  async register(
    username: string,
    password: string,
    role: UserRole = UserRole.MOZO,
    actorRole?: UserRole,
  ): Promise<Omit<User, 'password'>> {
    const privilegedRoles = [UserRole.ADMIN, UserRole.ENCARGADO];
    if (
      actorRole === UserRole.ENCARGADO &&
      privilegedRoles.includes(role)
    ) {
      throw new ForbiddenException(
        'El rol Encargado no puede crear usuarios Admin o Encargado.',
      );
    }

    const existingUser = await this.userRepository.findOne({
      where: { username },
    });
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepository.create({
      username,
      password: hashedPassword,
      role,
    });

    const savedUser = await this.userRepository.save(user);

    this.monitoringLogger.log({
      action: 'USER_REGISTERED_SUCCESS',
      userId: savedUser.id,
      username: savedUser.username,
      role: savedUser.role,
      timestamp: new Date().toISOString(),
    });

    const { password: _omitted, ...safeUser } = savedUser;
    return safeUser;
  }

  async login(
    username: string,
    password: string,
  ): Promise<{ accessToken: string }> {
    const user = await this.userRepository.findOne({ where: { username } });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { username: user.username, role: user.role };
    const accessToken = this.jwtService.sign(payload);

    // Log crítico: Login exitoso (operación de seguridad)
    this.monitoringLogger.log({
      action: 'USER_LOGIN_SUCCESS',
      userId: user.id,
      username: user.username,
      role: user.role,
      timestamp: new Date().toISOString(),
    });

    return { accessToken };
  }
}
