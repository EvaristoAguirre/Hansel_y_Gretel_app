import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import typeorm from '../config/typeORMconig';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductModule } from './Product/product.module';
import { CategoryModule } from './Category/category.module';
import { UserModule } from './User/user.module';
import { RealTimeModule } from './Real-time/real-time.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TableModule } from './Table/table.module';
import { OrderModule } from './Order/order.module';
import { RoomModule } from './Room/room.module';
import { IngredientModule } from './Ingredient/ingredient.module';
import { StockModule } from './Stock/stock.module';
import { SeederModule } from './Seeder/seeder.module';
import { UnitOfMeasurenModule } from './UnitOfMeasure/unitOfMeasure.module';

import { ScheduleModule } from '@nestjs/schedule';
import { ToppingsGroupsModule } from './ToppingsGroup/toppings-group.module';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [typeorm],
    }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('typeorm');
        const isDev = process.env.NODE_ENV !== 'production';

        return {
          type: dbConfig.type,
          host: dbConfig.host,
          port: dbConfig.port,
          username: dbConfig.username,
          password: dbConfig.password,
          database: dbConfig.database,
          autoLoadEntities: true,
          synchronize: isDev, // solo true en desarrollo
          dropSchema: false, // nunca true salvo que lo necesites puntualmente
          logging: isDev ? ['query', 'error'] : ['error'],
          schema: dbConfig.schema,
          entities: dbConfig.entities,
          migrations: dbConfig.migrations,
        };
      },
    }),
    EventEmitterModule.forRoot(),
    ProductModule,
    CategoryModule,
    UserModule,
    RealTimeModule,
    TableModule,
    OrderModule,
    RoomModule,
    IngredientModule,
    StockModule,
    SeederModule,
    UnitOfMeasurenModule,
    ToppingsGroupsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
