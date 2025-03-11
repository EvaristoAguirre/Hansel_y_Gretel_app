import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import {
  TokenExpiredError,
  JsonWebTokenError,
  NotBeforeError,
} from 'jsonwebtoken';
import { Response } from 'express';

@Catch(TokenExpiredError, JsonWebTokenError, NotBeforeError)
export class JwtExceptionFilter implements ExceptionFilter {
  catch(
    exception: TokenExpiredError | JsonWebTokenError | NotBeforeError,
    host: ArgumentsHost,
  ) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let message = 'Unauthorized';
    let statusCode = HttpStatus.UNAUTHORIZED;

    if (exception instanceof TokenExpiredError) {
      message = 'Token has expired';
    } else if (exception instanceof NotBeforeError) {
      message = 'Token is not yet valid';
    } else if (exception instanceof JsonWebTokenError) {
      if (exception.message === 'jwt must be provided') {
        message = 'Token not provided';
      } else if (exception.message === 'invalid signature') {
        message = 'Invalid token signature';
      } else {
        message = 'Invalid token';
      }
    }

    if (message.includes('permission') || message.includes('role')) {
      statusCode = HttpStatus.FORBIDDEN;
    }

    response.status(statusCode).json({
      statusCode,
      message,
      error: statusCode === HttpStatus.FORBIDDEN ? 'Forbidden' : 'Unauthorized',
    });
  }
}
