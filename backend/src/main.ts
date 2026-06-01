import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggerMidleware } from './Middleware/logger.middleware';
import { WsAdapter } from '@nestjs/platform-ws';
import { IoAdapter } from '@nestjs/platform-socket.io';
import rateLimit from 'express-rate-limit';
import { LoggerService } from './Monitoring/monitoring-logger.service';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { EnvNames } from './common/names.env';
import { ExceptionFilters } from './Filters/globalException.filters';
// import { GlobalExceptionFilter } from './Filters/globalException.filters';
import * as express from 'express';

async function bootstrap() {
  const configService = new ConfigService();

  const app = await NestFactory.create(AppModule);

  // =============================================
  // Configuración de Swagger/OpenAPI
  // =============================================

  if (configService.getOrThrow(EnvNames.NODE_ENV) === 'development') {
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
  }

  const allowedOrigins = configService
    .get<string>('ALLOWED_ORIGINS', '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: allowedOrigins.length ? allowedOrigins : ['http://localhost:3001'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  app.use(
    (
      req: express.Request,
      res: express.Response,
      next: express.NextFunction,
    ) => {
      if (req.path.startsWith('/export/stock/pdf')) return next();
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      next();
    },
  );

  app.use(express.json({ limit: '1mb' })); // Limita tamaño de JSON
  app.use(
    express.urlencoded({
      extended: true,
      limit: '1mb',
      parameterLimit: 1000, // Limita cantidad de parámetros
    }),
  );

  // Rate limiting global
  const globalLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: process.env.NODE_ENV === 'production' ? 1000 : 10000,
    message: 'Demasiadas peticiones, intenta más tarde',
    standardHeaders: true,
    legacyHeaders: false,
  });
  app.use(globalLimiter);

  // Rate limiting estricto para login
  const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: 'Demasiados intentos de login',
    skipSuccessfulRequests: true, // Solo cuenta intentos fallidos
  });
  app.use('/user/login', loginLimiter);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidUnknownValues: true,
      forbidNonWhitelisted: false,
      transform: true,
    }),
  );

  // Obtener el LoggerService del contenedor de dependencias
  const loggerService = app.get(LoggerService);

  app.useGlobalFilters(new ExceptionFilters(loggerService));
  app.use(LoggerMidleware);

  app.useWebSocketAdapter(new WsAdapter(app));
  app.useWebSocketAdapter(new IoAdapter(app));

  await app.listen(3000);

  const port = app.getHttpServer().address().port;
  console.log(`Server listening on http://localhost:${port}`);
  console.log(
    `📚 Swagger docs disponible en: http://localhost:${port}/api/docs`,
  );
}
bootstrap().catch((err) =>
  console.error('❌ Error al iniciar la aplicación:', err),
);
