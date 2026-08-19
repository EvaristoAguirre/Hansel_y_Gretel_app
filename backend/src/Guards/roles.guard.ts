import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from 'src/Enums/roles.enum';
import { ROLES_KEY } from '../Decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // @UseGuards(RolesGuard) sin @Roles no es público: hay que declarar roles.
    if (!requiredRoles || requiredRoles.length === 0) {
      throw new ForbiddenException(
        'Acceso denegado: el endpoint no tiene roles configurados.',
      );
    }

    const request = context.switchToHttp().getRequest();
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('Token no encontrado.');
    }

    let decodedToken: { role?: UserRole };
    try {
      decodedToken = this.jwtService.verify(token);
    } catch (error) {
      const name = (error as { name?: string })?.name;
      if (name === 'TokenExpiredError') {
        throw new UnauthorizedException('El token expiró. Iniciá sesión de nuevo.');
      }
      throw new UnauthorizedException('Token inválido.');
    }

    request.user = decodedToken;
    const userRole = decodedToken.role;

    if (!userRole || !requiredRoles.includes(userRole)) {
      throw new ForbiddenException(
        'No tenés permiso para acceder a este recurso.',
      );
    }

    return true;
  }
}
