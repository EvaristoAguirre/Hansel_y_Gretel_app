import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggerMidleware } from './Middleware/logger.middleware';
import { WsAdapter } from '@nestjs/platform-ws';
import { JwtExceptionFilter } from './Filters/token.filters';
import { ValidationExceptionFilter } from './Filters/validation.filters';
import { DatabaseExceptionFilter } from './Filters/database.filters';
import { LoggingExceptionFilter } from './Filters/logging-exception.filter';
import { IoAdapter } from '@nestjs/platform-socket.io';
import rateLimit from 'express-rate-limit';
import { LoggerService } from './Monitoring/monitoring-logger.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
// import { GlobalExceptionFilter } from './Filters/globalException.filters';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Obtener el LoggerService del contenedor de dependencias
  const loggerService = app.get(LoggerService);

  // =============================================
  // Configuración de Swagger/OpenAPI
  // =============================================
  const config = new DocumentBuilder()
    .setTitle('Hansel y Gretel API')
    .setDescription(
      `
## API de gestión para cafetería Hansel y Gretel

Esta API permite gestionar todos los aspectos del negocio:

### Módulos principales:
- **Autenticación**: Login y registro de usuarios
- **Productos**: CRUD de productos, promociones y búsquedas
- **Categorías**: Organización de productos por categorías
- **Pedidos**: Gestión completa del ciclo de vida de pedidos
- **Mesas y Salones**: Control de mesas y su distribución
- **Ingredientes y Toppings**: Gestión de ingredientes y extras
- **Stock**: Control de inventario
- **Caja Diaria**: Apertura/cierre de caja, movimientos y métricas
- **Unidades de Medida**: Gestión de unidades para ingredientes

### Autenticación:
La mayoría de endpoints requieren un token JWT válido.
Obtener el token mediante POST /user/login

### Roles de usuario:
- **ADMIN**: Acceso total
- **ENCARGADO**: Gestión de productos, caja y reportes
- **MOZO**: Gestión de pedidos y mesas
- **INVENTARIO**: Gestión de stock
      `,
    )
    .setVersion('1.0.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingrese su token JWT',
        in: 'header',
      },
      'JWT-auth',
    )
    .addTag('Auth', 'Endpoints de autenticación (login/registro)')
    .addTag('Producto', 'Gestión de productos y promociones')
    .addTag('Categoría', 'Gestión de categorías de productos')
    .addTag('Pedido', 'Gestión de pedidos')
    .addTag('Mesa', 'Gestión de mesas')
    .addTag('Salón', 'Gestión de salones/rooms')
    .addTag('Ingrediente', 'Gestión de ingredientes y toppings')
    .addTag('Stock', 'Control de inventario')
    .addTag('Caja Diaria', 'Apertura/cierre de caja y movimientos')
    .addTag('Unidad de Medida', 'Gestión de unidades de medida')
    .addTag('Grupos de Toppings', 'Gestión de grupos de toppings')
    .addTag('Impresora', 'Impresión de tickets y comandas')
    .addTag('Exportar', 'Exportación de reportes PDF')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
    customSiteTitle: 'Hansel y Gretel API Docs',
  });

  // const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  app.useGlobalFilters(
    new LoggingExceptionFilter(loggerService),
    new JwtExceptionFilter(),
    new ValidationExceptionFilter(),
    new DatabaseExceptionFilter(),
    // new GlobalExceptionFilter(),
  );
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.use(LoggerMidleware);
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.useWebSocketAdapter(new WsAdapter(app));
  app.useWebSocketAdapter(new IoAdapter(app));
  app.use(
    '/user/login',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10,
    }),
  );
  await app.listen(3000);

  const port = app.getHttpServer().address().port;
  console.log(`Server listening on http://localhost:${port}`);
  console.log(
    `📚 Swagger docs disponible en: http://localhost:${port}/api/docs`,
  );
}
bootstrap();
