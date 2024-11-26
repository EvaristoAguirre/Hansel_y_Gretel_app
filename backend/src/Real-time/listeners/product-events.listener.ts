import { Injectable } from '@nestjs/common';
import { BroadcastService } from '../broadcast.service';
import { Product } from 'src/Product/product.entity';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class ProductWSListener {
  constructor(private readonly broadcastService: BroadcastService) {}

  @OnEvent('product.created')
  handleProductCreated(event: { product: Product }) {
    console.log('Evento detectado: Producto creado', event.product);

    // Evento por WS
    this.broadcastService.broadcast('productCreated', event.product);
  }
}
