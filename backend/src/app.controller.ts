import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('App')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({
    summary: 'Root',
    description: 'Ruta raíz del servidor',
  })
  @ApiResponse({
    status: 200,
    description: 'Servidor funcionando',
    schema: { example: 'Hello World!' },
  })
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @ApiOperation({
    summary: 'Health Check',
    description: 'Verifica que el servidor está en línea y respondiendo',
  })
  @ApiResponse({
    status: 200,
    description: 'Servidor en funcionamiento',
    schema: {
      example: { status: 'ok', timestamp: '2026-04-23T21:00:00.000Z' },
    },
  })
  getHealth(): { status: string; timestamp: string } {
    return this.appService.getHealth();
  }
}
