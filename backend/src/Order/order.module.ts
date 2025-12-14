import { Module } from '@nestjs/common';
import { OrderController } from './controllers/order.controller';
import { OrderService } from './services/order.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderRepository } from './repositories/order.repository';
import { OrderDetails } from './entities/order_details.entity';
import { ArchiveService } from './services/archive.service';
import { ArchivedOrder } from './entities/archived_order.entity';
import { ArchivedOrderDetails } from './entities/archived_order_details.entity';
import { Table } from 'src/Table/table.entity';
import { Product } from 'src/Product/entities/product.entity';
import { NotificationService } from './services/notification.service';
import { UserModule } from 'src/User/user.module';
import { PromotionProduct } from 'src/Product/entities/promotionProducts.entity';
import { UnitOfMeasurenModule } from 'src/UnitOfMeasure/unitOfMeasure.module';
import { Ingredient } from 'src/Ingredient/ingredient.entity';
import { DailyCash } from 'src/daily-cash/daily-cash.entity';
import { DailyCashModule } from 'src/daily-cash/daily-cash.module';
import { OrderDetailToppings } from './entities/order_details_toppings.entity';

import { StockModule } from 'src/Stock/stock.module';
import { TableModule } from 'src/Table/table.module';
import { PrinterModule } from 'src/Printer/printer.module';
import { OrderPayment } from './entities/order_payment.entity';
import { PromotionSlot } from 'src/Product/entities/promotion-slot.entity';
import { PromotionSlotOption } from 'src/Product/entities/promotion-slot-option.entity';
import { OrderPromotionSelection } from './entities/order-promotion-selection.entity';

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
      OrderPayment,
      PromotionSlot,
      PromotionSlotOption,
      OrderPromotionSelection,
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
