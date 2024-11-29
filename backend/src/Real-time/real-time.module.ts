import { Module } from '@nestjs/common';
import { BroadcastService } from './broadcast.service';
import { ProductWSListener } from './listeners/product-events.listener';
import { RealTimeGateway } from './real-time.gateway';
import { CategoryWSListener } from './listeners/category-events.listener';

@Module({
  imports: [],
  providers: [
    BroadcastService,
    RealTimeGateway,
    ProductWSListener,
    CategoryWSListener,
  ],
  exports: [BroadcastService, ProductWSListener, CategoryWSListener],
})
export class RealTimeModule {
  // configure(consumer: MiddlewareConsumer) {
  //   consumer.apply(WsAuthMiddleware).forRoutes('*');
}
