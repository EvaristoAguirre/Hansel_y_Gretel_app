// import {
//   ExceptionFilter,
//   Catch,
//   ArgumentsHost,
//   HttpStatus,
//   HttpException,
// } from '@nestjs/common';
// import { Response } from 'express';

// @Catch()
// export class GlobalExceptionFilter implements ExceptionFilter {
//   catch(exception: unknown, host: ArgumentsHost) {
//     const ctx = host.switchToHttp();
//     const response = ctx.getResponse<Response>();

//     if (exception instanceof HttpException) {
//       const status = exception.getStatus();
//       response.status(status).json(exception.getResponse());
//       return;
//     }

//     console.error('Unhandled error:', exception);
//     response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
//       statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
//       message: 'Internal server error',
//       error: 'Internal Server Error',
//     });
//   }
// }

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../Monitoring/monitoring-logger.service';

@Catch() // Captura TODAS las excepciones, no solo HttpException
export class ExceptionFilters implements ExceptionFilter {
  private logger = new Logger(ExceptionFilters.name);
  constructor(private readonly loggerService: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    this.loggerService.format();

    let status = 500; // Por defecto, Internal Server Error
    let error: { message: string } = { message: 'Internal Server Error' };
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const responseData = exception.getResponse();

      if (typeof responseData === 'string') {
        error = { message: responseData };
      } else if (typeof responseData === 'object' && responseData !== null) {
        const responseObject = responseData as { message?: string | string[] };
        error = {
          message: Array.isArray(responseObject.message)
            ? responseObject.message.join(', ')
            : responseObject.message || 'Error desconocido',
        };
      }
    } else if (exception instanceof Error) {
      //  Captura errores inesperados (TypeORM, DB, TypeScript, etc.)
      this.logger.error(exception.stack);
      this.loggerService.error(exception.stack);

      error = { message: exception.message };
    }

    //  Guardamos el error en logs (Terminal + LoggerService)
    this.logger.error(
      `[${request.method}] ${request.url} - ${JSON.stringify(error)}`,
    );
    this.loggerService.error(
      `[${request.method}] ${request.url} - ${JSON.stringify(error)}`,
    );

    this.loggerService.format();

    response.status(status).json({
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      error,
    });
  }
}
