import { Module } from '@nestjs/common';
import { BroadcastService } from './broadcast.service';
import { ProductWSListener } from './listeners/product-events.listener';
import { RealTimeGateway } from './real-time.gateway';

@Module({
  imports: [],
  providers: [BroadcastService, RealTimeGateway, ProductWSListener],
  exports: [BroadcastService, ProductWSListener],
})
export class RealTimeModule {
  // configure(consumer: MiddlewareConsumer) {
  //   consumer.apply(WsAuthMiddleware).forRoutes('*');
}
