import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { LoggerService } from '../Monitoring/monitoring-logger.service';

@Catch()
export class LoggingExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(LoggingExceptionFilter.name);

  constructor(private readonly monitoringLogger: LoggerService) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status: number;
    let message: string;
    let errorDetails: any = {};

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      message = exception.message;
      errorDetails = exception.getResponse();
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      message = 'Internal server error';
      errorDetails = {
        message:
          exception instanceof Error ? exception.message : 'Unknown error',
        stack: exception instanceof Error ? exception.stack : undefined,
      };
    }

    // Extraer información del contexto
    const timestamp = new Date().toISOString();
    const method = request.method;
    const url = request.url;
    const userAgent = request.get('User-Agent') || '';
    const ip = request.ip || request.connection.remoteAddress || '';

    // Determinar el servicio basado en la URL
    const service = this.extractServiceFromUrl(url);

    // Log estructurado del error
    const errorLog = {
      action: 'APPLICATION_ERROR',
      service,
      method,
      url,
      status,
      message,
      errorDetails,
      timestamp,
      userAgent,
      ip,
      userId: (request as any).user?.id || 'anonymous',
    };

    // Log con el nivel apropiado
    if (status >= 500) {
      this.monitoringLogger.error(errorLog);
    } else if (status >= 400) {
      this.monitoringLogger.warn(errorLog);
    } else {
      this.monitoringLogger.log(errorLog);
    }

    // Log también en consola para desarrollo
    this.logger.error(
      `${method} ${url} - ${status} - ${message}`,
      exception instanceof Error ? exception.stack : undefined,
    );

    // Respuesta al cliente
    response.status(status).json({
      statusCode: status,
      timestamp,
      path: url,
      message: status >= 500 ? 'Internal server error' : message,
      ...(process.env.NODE_ENV === 'development' && { errorDetails }),
    });
  }

  private extractServiceFromUrl(url: string): string {
    const urlParts = url.split('/').filter((part) => part);

    if (urlParts.length === 0) return 'unknown';

    const firstSegment = urlParts[0].toLowerCase();

    // Mapeo de rutas a servicios
    const serviceMap: { [key: string]: string } = {
      orders: 'OrderService',
      products: 'ProductService',
      'daily-cash': 'DailyCashService',
      auth: 'AuthService',
      users: 'UserService',
      tables: 'TableService',
      stock: 'StockService',
      ingredients: 'IngredientService',
      categories: 'CategoryService',
      rooms: 'RoomService',
      export: 'ExportService',
      printer: 'PrinterService',
    };

    return serviceMap[firstSegment] || 'UnknownService';
  }
}
