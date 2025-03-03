import { Module } from '@nestjs/common';
import { BroadcastService } from './broadcast.service';
import { ProductWSListener } from './listeners/product-events.listener';
import { RealTimeGateway } from './real-time.gateway';
import { CategoryWSListener } from './listeners/category-events.listener';
import { OrderWSListener } from './listeners/order-events.listener';
import { TableWSListener } from './listeners/table-events.listener';
import { OrderDetailsWSListener } from './listeners/orderDetails-events.listener';
import { StockWSListener } from './listeners/stock-events.listener';

@Module({
  imports: [],
  providers: [
    BroadcastService,
    RealTimeGateway,
    ProductWSListener,
    CategoryWSListener,
    OrderWSListener,
    TableWSListener,
    OrderDetailsWSListener,
    StockWSListener,
  ],
  exports: [
    BroadcastService,
    ProductWSListener,
    CategoryWSListener,
    OrderWSListener,
    TableWSListener,
    OrderDetailsWSListener,
    StockWSListener,
  ],
})
export class RealTimeModule {
  // configure(consumer: MiddlewareConsumer) {
  //   consumer.apply(WsAuthMiddleware).forRoutes('*');
}
