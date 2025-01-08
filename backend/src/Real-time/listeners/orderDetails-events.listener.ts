import { Injectable } from '@nestjs/common';
import { BroadcastService } from '../broadcast.service';
import { OnEvent } from '@nestjs/event-emitter';
import { OrderDetails } from 'src/Order/order_details.entity';

@Injectable()
export class OrderDetailsWSListener {
  constructor(private readonly broadcastService: BroadcastService) {}

  @OnEvent('orderDetails.created')
  handleOrderDetailsCreated(event: { orderDetails: OrderDetails }) {
    this.broadcastService.broadcast('orderDetailsCreated', event.orderDetails);
  }
  @OnEvent('orderDetails.updated')
  handleOrderDetailsUpdated(event: { orderDetails: OrderDetails }) {
    this.broadcastService.broadcast('orderDetailsUpdated', event.orderDetails);
  }
  @OnEvent('orderDetails.delete')
  handleOrderDetailsDelete(event: { orderDetails: OrderDetails }) {
    this.broadcastService.broadcast('orderDetailsDelete', event.orderDetails);
  }
}
