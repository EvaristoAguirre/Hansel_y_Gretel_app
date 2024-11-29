import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  async use(req: Request, res: Response, next: NextFunction) {
    const sessionToken = req.headers['authorization']?.split(' ')[1];
    if (!sessionToken) {
      return res.status(401).json({ message: 'Sesión no válida' });
    }
    // Verificar el token o sesión (implementación local)
    // Si es válido:
    next();
    // Si no:
    // return res.status(401).json({ message: 'Sesión no válida' });
  }
}
