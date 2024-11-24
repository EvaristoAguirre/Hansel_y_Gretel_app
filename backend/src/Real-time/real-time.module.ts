import { MiddlewareConsumer, Module } from '@nestjs/common';
import { ProductGateway } from './gateways/product.gateway';
import { BroadcastService } from './services/broadcast.service';
import { ProductModule } from 'src/Product/product.module';
import { WsAuthMiddleware } from './middleware/ws-auth.middleware';

@Module({
  imports: [ProductModule],
  providers: [ProductGateway, BroadcastService],
  exports: [ProductGateway, BroadcastService],
})
export class RealTimeModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(WsAuthMiddleware).forRoutes('*');
  }
}
