import { Module } from '@nestjs/common';
import { BroadcastService } from './broadcast.service';
import { ProductWSListener } from './listeners/product-events.listener';
import { RealTimeGateway } from './real-time.gateway';
import { CategoryWSListener } from './listeners/category-events.listener';
import { OrderWSListener } from './listeners/order-events.listener';
import { TableWSListener } from './listeners/table-events.listener';
import { StockWSListener } from './listeners/stock-events.listener';
import { DailyCashWSListener } from './listeners/daily-cash.listener';
import { UserModule } from 'src/User/user.module';

@Module({
  imports: [UserModule],
  providers: [
    BroadcastService,
    RealTimeGateway,
    ProductWSListener,
    CategoryWSListener,
    OrderWSListener,
    TableWSListener,
    StockWSListener,
    DailyCashWSListener,
  ],
  exports: [
    BroadcastService,
    ProductWSListener,
    CategoryWSListener,
    OrderWSListener,
    TableWSListener,
    StockWSListener,
    DailyCashWSListener,
  ],
})
export class RealTimeModule {}
