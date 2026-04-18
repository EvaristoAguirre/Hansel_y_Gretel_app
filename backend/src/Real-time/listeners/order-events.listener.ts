import { Injectable } from '@nestjs/common';
import { BroadcastService } from '../broadcast.service';
import { OnEvent } from '@nestjs/event-emitter';
import { Order } from 'src/Order/entities/order.entity';

@Injectable()
export class OrderWSListener {
  constructor(private readonly broadcastService: BroadcastService) {}

  /** Apertura de orden: todos los clientes necesitan ver la mesa ocupada. */
  @OnEvent('order.created')
  handleOrderCreated(event: { order: Order }) {
    this.broadcastService.broadcast('orderCreated', event.order);
  }

  /** Actualización de productos: solo los clientes que ven esa mesa la necesitan. */
  @OnEvent('order.updated')
  handleOrderUpdated(event: { order: Order }) {
    const tableId = event.order?.table?.id;
    if (tableId) {
      this.broadcastService.broadcastToTable(tableId, 'orderUpdated', event.order);
    } else {
      this.broadcastService.broadcast('orderUpdated', event.order);
    }
  }

  /** Cancelación/eliminación: todos necesitan saber que la mesa quedó libre. */
  @OnEvent('order.deleted')
  handleOrderDeleted(event: { order: Order }) {
    this.broadcastService.broadcast('orderDeleted', event.order);
  }

  /** Mesa pasa a pendiente de cobro: broadcast global para que todos actualicen
   *  el estado de la mesa en la vista de salón. */
  @OnEvent('order.updatePending')
  handleOrderUpdatePending(event: { order: Order }) {
    this.broadcastService.broadcast('orderUpdatedPending', event.order);
  }

  /** Mesa cobrada y cerrada: todos necesitan ver el cambio de estado. */
  @OnEvent('order.updateClose')
  handleOrderUpdateClose(event: { order: Order }) {
    this.broadcastService.broadcast('orderUpdatedClose', event.order);
  }

  /** Ticket impreso (detalle completo): solo los clientes que ven esa mesa lo necesitan. */
  @OnEvent('order.ticketPrinted')
  handleOrderTicketPrinted(event: { order: Order }) {
    const tableId = event.order?.table?.id;
    if (tableId) {
      this.broadcastService.broadcastToTable(tableId, 'orderTicketPrinted', event.order);
    } else {
      this.broadcastService.broadcast('orderTicketPrinted', event.order);
    }
  }
}
