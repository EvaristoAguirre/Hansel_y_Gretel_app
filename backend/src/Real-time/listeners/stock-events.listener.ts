import { Injectable } from '@nestjs/common';
import { BroadcastService } from '../broadcast.service';
import { OnEvent } from '@nestjs/event-emitter';
import { StockWsPayload } from 'src/Stock/stock-ws.payload';

@Injectable()
export class StockWSListener {
  constructor(private readonly broadcastService: BroadcastService) {}

  @OnEvent('stock.created')
  handleStockCreated(event: StockWsPayload) {
    this.broadcastService.broadcast('stock.created', event);
  }

  @OnEvent('stock.updated')
  handleStockUpdated(event: StockWsPayload) {
    this.broadcastService.broadcast('stock.updated', event);
  }

  @OnEvent('stock.deducted')
  handleStockDeducted(event: StockWsPayload) {
    this.broadcastService.broadcast('stock.deducted', event);
  }

  @OnEvent('stock.restored')
  handleStockRestored(event: StockWsPayload) {
    this.broadcastService.broadcast('stock.restored', event);
  }
}
