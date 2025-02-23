import { Module } from '@nestjs/common';
import { StockController } from './stock.controller';
import { StockService } from './stock.service';

@Module({
  imports: [],
  controllers: [StockController],
  providers: [StockService],
  exports: [],
})
export class StockModule {}
