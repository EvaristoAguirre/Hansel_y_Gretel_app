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

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Order,
      OrderDetails,
      ArchivedOrder,
      ArchivedOrderDetails,
    ]),
  ],
  controllers: [OrderController],
  providers: [OrderService, OrderRepository, ArchiveService],
})
export class OrderModule {}
