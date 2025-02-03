import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as fs from 'fs';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { LoggerMidleware } from './Middleware/logger.middleware';
import { WsAdapter } from '@nestjs/platform-ws';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
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
  await app.listen(3000, '0.0.0.0');
  const port = app.getHttpServer().address().port;
  console.log(`Server listening on http://localhost:${port}`);
}
bootstrap();
