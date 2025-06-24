import { Module } from '@nestjs/common';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { OrderRepository } from './order.repository';
import { OrderDetails } from './order_details.entity';
import { ArchiveService } from './archive.service';
import { ArchivedOrder } from './archived_order.entity';
import { ArchivedOrderDetails } from './archived_order_details.entity';
import { Table } from 'src/Table/table.entity';
import { Product } from 'src/Product/product.entity';
import { NotificationService } from './notification.service';
import { UserModule } from 'src/User/user.module';
import { PromotionProduct } from 'src/Product/promotionProducts.entity';
import { UnitOfMeasurenModule } from 'src/UnitOfMeasure/unitOfMeasure.module';
import { StockService } from 'src/Stock/stock.service';
import { Ingredient } from 'src/Ingredient/ingredient.entity';
import { PrinterService } from 'src/Printer/printer.service';
import { TableService } from 'src/Table/table.service';
import { DailyCash } from 'src/daily-cash/daily-cash.entity';
import { DailyCashModule } from 'src/daily-cash/daily-cash.module';
import { OrderDetailToppings } from './order_details_toppings.entity';
import { DailyCashService } from 'src/daily-cash/daily-cash.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderDetails,
      Table,
      Product,
      ArchivedOrder,
      ArchivedOrderDetails,
      PromotionProduct,
      Ingredient,
      DailyCash,
      OrderDetailToppings,
    ]),
    UserModule,
    UnitOfMeasurenModule,
    DailyCashModule,
  ],
  controllers: [OrderController],
  providers: [
    OrderService,
    OrderRepository,
    ArchiveService,
    NotificationService,
    StockService,
    PrinterService,
    TableService,
    DailyCashService,
  ],
})
export class OrderModule {}
