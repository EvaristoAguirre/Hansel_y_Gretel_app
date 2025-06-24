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
import { Ingredient } from 'src/Ingredient/ingredient.entity';
import { DailyCash } from 'src/daily-cash/daily-cash.entity';
import { DailyCashModule } from 'src/daily-cash/daily-cash.module';
import { OrderDetailToppings } from './order_details_toppings.entity';

import { StockModule } from 'src/Stock/stock.module';
import { TableModule } from 'src/Table/table.module';
import { PrinterModule } from 'src/Printer/printer.module';

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
    StockModule,
    TableModule,
    PrinterModule,
  ],
  controllers: [OrderController],
  providers: [
    OrderService,
    OrderRepository,
    ArchiveService,
    NotificationService,
  ],
})
export class OrderModule {}
