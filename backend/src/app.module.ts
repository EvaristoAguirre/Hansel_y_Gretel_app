import { Module, OnModuleInit } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import typeorm from '../config/typeORMconig';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductModule } from './Product/product.module';
import { CategoryModule } from './Category/category.module';
import { UserModule } from './User/user.module';
import { ProviderModule } from './Provider/provider.module';
import { RealTimeModule } from './Real-time/real-time.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { TableModule } from './Table/table.module';
import { OrderModule } from './Order/order.module';
import { RoomModule } from './Room/room.module';
import { IngredientModule } from './Ingredient/ingredient.module';
import { StockModule } from './Stock/stock.module';
import { SeederModule } from './Seeder/seeder.module';
import { UnitOfMeasurenModule } from './UnitOfMeasure/unitOfMeasure.module';
import { PrinterModule } from './Printer/printer.module';
import { PrinterService } from './Printer/printer.service';
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
    UserModule,
    ProviderModule,
    RealTimeModule,
    TableModule,
    OrderModule,
    RoomModule,
    IngredientModule,
    StockModule,
    SeederModule,
    UnitOfMeasurenModule,
    PrinterModule,
  ],
  controllers: [AppController],
  providers: [AppService, PrinterService],
})
export class AppModule {}