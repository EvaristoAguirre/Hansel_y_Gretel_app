import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const exceptionResponse = exception.getResponse() as any;

    // Si la respuesta ya contiene errores de validación estructurados, usarlos
    if (exceptionResponse.errors || exceptionResponse.details) {
      response.status(HttpStatus.BAD_REQUEST).json({
        statusCode: HttpStatus.BAD_REQUEST,
        message: exceptionResponse.message || 'Error de validación',
        errors: exceptionResponse.errors || [],
        details: exceptionResponse.details || [],
      });
    } else {
      // Si no, devolver la respuesta estándar
      response.status(HttpStatus.BAD_REQUEST).json(exceptionResponse);
    }
  }
}
