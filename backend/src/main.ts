import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { LoggerMidleware } from './Middleware/logger.middleware';
import { WsAdapter } from '@nestjs/platform-ws';
import { JwtExceptionFilter } from './Filters/token.filters';
import { ValidationExceptionFilter } from './Filters/validation.filters';
import { DatabaseExceptionFilter } from './Filters/database.filters';
import { IoAdapter } from '@nestjs/platform-socket.io';
import rateLimit from 'express-rate-limit';
// import { GlobalExceptionFilter } from './Filters/globalException.filters';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
  app.useGlobalFilters(
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
  // app.enableCors({
  //   origin: allowedOrigins,
  //   methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  //   credentials: true,
  // });
  // app.enableCors({
  //   origin: (origin, callback) => {
  //     if (!origin || allowedOrigins.includes(origin)) {
  //       callback(null, true);
  //     } else {
  //       callback(new Error(`Not allowed by CORS: ${origin}`));
  //     }
  //   },
  //   credentials: true,
  // });
  app.useWebSocketAdapter(new WsAdapter(app));
  app.useWebSocketAdapter(new IoAdapter(app));
  app.use(
    '/user/login',
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: 10,
    }),
  );
  await app.listen(3000, '0.0.0.0');

  const port = app.getHttpServer().address().port;
  console.log(`Server listening on http://localhost:${port}`);
}
bootstrap();
