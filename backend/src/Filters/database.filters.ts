import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
} from '@nestjs/common';
import { QueryFailedError } from 'typeorm';
import { Response } from 'express';

@Catch(QueryFailedError)
export class DatabaseExceptionFilter implements ExceptionFilter {
  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let message = 'Database error';
    if (exception.message.includes('unique constraint')) {
      message = 'Duplicate entry';
    }

    response.status(HttpStatus.CONFLICT).json({
      statusCode: HttpStatus.CONFLICT,
      message,
      error: 'Conflict',
    });
  }
}
