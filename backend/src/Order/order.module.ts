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
import { UnitOfMeasure } from 'src/Ingredient/unitOfMesure.entity';

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
    ]),
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
  ],
})
export class OrderModule {}
