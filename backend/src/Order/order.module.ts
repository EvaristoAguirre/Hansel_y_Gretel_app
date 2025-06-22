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
import { TableRepository } from 'src/Table/table.repository';
import { Product } from 'src/Product/product.entity';
import { ProductRepository } from 'src/Product/product.repository';
import { NotificationService } from './notification.service';
import { RoomRepository } from 'src/Room/room.repository';
import { Room } from 'src/Room/room.entity';
import { CategoryRepository } from 'src/Category/category.repository';
import { Category } from 'src/Category/category.entity';
import { UserModule } from 'src/User/user.module';
import { PromotionProduct } from 'src/Product/promotionProducts.entity';
import { UnitOfMeasure } from 'src/UnitOfMeasure/unitOfMesure.entity';
import { UnitOfMeasurenModule } from 'src/UnitOfMeasure/unitOfMeasure.module';
import { StockService } from 'src/Stock/stock.service';
import { StockRepository } from 'src/Stock/stock.repository';
import { Stock } from 'src/Stock/stock.entity';
import { Ingredient } from 'src/Ingredient/ingredient.entity';
import { IngredientService } from 'src/Ingredient/ingredient.service';
import { IngredientRepository } from 'src/Ingredient/ingredient.repository';
import { PrinterService } from 'src/Printer/printer.service';
import { TableService } from 'src/Table/table.service';
import { DailyCash } from 'src/daily-cash/daily-cash.entity';
import { DailyCashRepository } from 'src/daily-cash/daily-cash.repository';
import { DailyCashModule } from 'src/daily-cash/daily-cash.module';
import { ToppingsGroup } from 'src/ToppingsGroup/toppings-group.entity';
import { ProductAvailableToppingGroup } from 'src/Ingredient/productAvailableToppingsGroup.entity';
import { OrderDetailToppings } from './order_details_toppings.entity';
import { CashMovement } from 'src/daily-cash/cash-movement.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderDetails,
      Table,
      Product,
      ArchivedOrder,
      ArchivedOrderDetails,
      Room,
      Category,
      UnitOfMeasure,
      PromotionProduct,
      Stock,
      Ingredient,
      DailyCash,
      ToppingsGroup,
      ProductAvailableToppingGroup,
      OrderDetailToppings,
      CashMovement,
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
    TableRepository,
    ProductRepository,
    NotificationService,
    RoomRepository,
    CategoryRepository,
    StockService,
    StockRepository,
    IngredientService,
    IngredientRepository,
    PrinterService,
    TableService,
    DailyCashRepository,
  ],
})
export class OrderModule {}
