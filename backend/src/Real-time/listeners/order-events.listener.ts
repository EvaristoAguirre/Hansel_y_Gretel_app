import { Injectable } from '@nestjs/common';
import { BroadcastService } from '../broadcast.service';
import { OnEvent } from '@nestjs/event-emitter';
import { Order } from 'src/Order/order.entity';

@Injectable()
export class OrderWSListener {
  constructor(private readonly broadcastService: BroadcastService) {}

  @OnEvent('order.created')
  handleOrderCreated(event: { order: Order }) {
    this.broadcastService.broadcast('orderCreated', event.order);
  }

  @OnEvent('order.updated')
  handleOrderUpdated(event: { order: Order }) {
    this.broadcastService.broadcast('orderUpdated', event.order);
  }

  @OnEvent('order.deleted')
  handleOrderDeleted(event: { order: Order }) {
    this.broadcastService.broadcast('orderDeleted', event.order);
  }
}
