import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import typeorm from '../config/typeORMconig';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductModule } from './Product/product.module';
import { CategoryModule } from './Category/category.module';
import { ProviderModule } from './Provider/provider.module';
import { RealTimeModule } from './Real-time/real-time.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeorm],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const config = configService.get('typeorm');
        return config;
      },
    }),
    EventEmitterModule.forRoot(),
    ProductModule,
    CategoryModule,
    ProviderModule,
    RealTimeModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
