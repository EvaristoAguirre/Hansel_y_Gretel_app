import { Injectable } from '@nestjs/common';
import { BroadcastService } from '../broadcast.service';
import { OnEvent } from '@nestjs/event-emitter';
import { Stock } from 'src/Stock/stock.entity';

@Injectable()
export class StockWSListener {
  constructor(private readonly broadcastService: BroadcastService) {}

  @OnEvent('createStock')
  handleCreateStock(event: { stock: Stock }) {
    this.broadcastService.broadcast('stock.created', event.stock);
  }

  @OnEvent('updateStock')
  handleUpdateStock(event: { stock: Stock }) {
    this.broadcastService.broadcast('stock.updated', event.stock);
  }

  @OnEvent('deductStock')
  handleDeductStock(event: { stock: Stock }) {
    this.broadcastService.broadcast('stock.deducted', event.stock);
  }
}
