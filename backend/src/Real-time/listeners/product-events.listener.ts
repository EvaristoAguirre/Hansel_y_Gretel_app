import { Injectable } from '@nestjs/common';
import { BroadcastService } from '../broadcast.service';
import { Product } from 'src/Product/product.entity';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class ProductWSListener {
  constructor(private readonly broadcastService: BroadcastService) {}

  @OnEvent('product.created')
  handleProductCreated(event: { product: Product }) {
    this.broadcastService.broadcast('productCreated', event.product);
  }

  @OnEvent('product.updated')
  handleProductUpdated(event: { product: Product }) {
    this.broadcastService.broadcast('productUpdated', event.product);
  }

  @OnEvent('product.deleted')
  handleProductDeleted(event: { product: string }) {
    this.broadcastService.broadcast('productDeleted', event.product);
  }
}
