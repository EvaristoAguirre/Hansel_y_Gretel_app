import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LoggerMidleware } from './Middleware/logger.middleware';
import { WsAdapter } from '@nestjs/platform-ws';
import { JwtExceptionFilter } from './Filters/token.filters';
import { ValidationExceptionFilter } from './Filters/validation.filters';
import { DatabaseExceptionFilter } from './Filters/database.filters';
// import { GlobalExceptionFilter } from './Filters/globalException.filters';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalFilters(
    new JwtExceptionFilter(),
    new ValidationExceptionFilter(),
    new DatabaseExceptionFilter(),
    // new GlobalExceptionFilter(),
  );

  const documentConfig = new DocumentBuilder()
    .setTitle('Hansel & Gretel')
    .setDescription('Documentacion técnica')
    .addBearerAuth()
    .setVersion('1.0.0')
    .build();

  const documentacion = SwaggerModule.createDocument(app, documentConfig);
  SwaggerModule.setup('api', app, documentacion);
  app.useGlobalPipes(new ValidationPipe({ whitelist: true }));
  app.use(LoggerMidleware);
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });
  app.useWebSocketAdapter(new WsAdapter(app));
  await app.listen(3000);
  const port = app.getHttpServer().address().port;
  console.log(`Server listening on http://localhost:${port}`);
}
bootstrap();
