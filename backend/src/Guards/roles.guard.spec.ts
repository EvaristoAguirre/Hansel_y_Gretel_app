import {
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { RolesGuard } from './roles.guard';
import { UserRole } from '../Enums/roles.enum';
import { ROLES_KEY } from '../Decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: { getAllAndOverride: jest.Mock };
  let jwtService: { verify: jest.Mock };

  const mockContext = (authHeader?: string): ExecutionContext =>
    ({
      getHandler: () => ({}),
      getClass: () => ({}),
      switchToHttp: () => ({
        getRequest: () => ({
          headers: { authorization: authHeader },
        }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    reflector = { getAllAndOverride: jest.fn() };
    jwtService = { verify: jest.fn() };
    guard = new RolesGuard(
      reflector as unknown as Reflector,
      jwtService as unknown as JwtService,
    );
  });

  it('deniega si no hay @Roles en handler ni en clase', () => {
    reflector.getAllAndOverride.mockReturnValue(undefined);
    expect(() => guard.canActivate(mockContext())).toThrow(ForbiddenException);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      expect.anything(),
      expect.anything(),
    ]);
  });

  it('deniega si @Roles está vacío', () => {
    reflector.getAllAndOverride.mockReturnValue([]);
    expect(() => guard.canActivate(mockContext())).toThrow(ForbiddenException);
  });

  it('usa roles de clase cuando el handler no define @Roles', () => {
    reflector.getAllAndOverride.mockReturnValue([
      UserRole.ADMIN,
      UserRole.ENCARGADO,
    ]);
    jwtService.verify.mockReturnValue({ role: UserRole.ENCARGADO });

    expect(guard.canActivate(mockContext('Bearer token-valido'))).toBe(true);
  });

  it('rechaza sin token con 401', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    expect(() => guard.canActivate(mockContext())).toThrow(
      UnauthorizedException,
    );
  });

  it('rechaza token inválido con 401', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    jwtService.verify.mockImplementation(() => {
      throw new Error('invalid token');
    });
    expect(() =>
      guard.canActivate(mockContext('Bearer token-falso')),
    ).toThrow(UnauthorizedException);
  });

  it('rechaza token vencido con 401', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    const expired = new Error('jwt expired');
    expired.name = 'TokenExpiredError';
    jwtService.verify.mockImplementation(() => {
      throw expired;
    });
    expect(() =>
      guard.canActivate(mockContext('Bearer token-vencido')),
    ).toThrow(UnauthorizedException);
  });

  it('rechaza si el rol del token no está permitido', () => {
    reflector.getAllAndOverride.mockReturnValue([UserRole.ADMIN]);
    jwtService.verify.mockReturnValue({ role: UserRole.MOZO });

    expect(() =>
      guard.canActivate(mockContext('Bearer token-valido')),
    ).toThrow(ForbiddenException);
  });
});
