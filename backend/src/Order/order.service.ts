import { Injectable } from '@nestjs/common';
import { OrderRepository } from './order.repository';
import { CreateOrderDto } from 'src/DTOs/create-order.dto';
import { Order } from './order.entity';
import { UpdateOrderDto } from 'src/DTOs/update-order.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderDetails } from './order_details.entity';
import { OrderSummaryResponseDto } from 'src/DTOs/orderSummaryResponse.dto';

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async openOrder(orderToCreate: CreateOrderDto): Promise<Order> {
    const orderOpened = await this.orderRepository.openOrder(orderToCreate);
    await this.eventEmitter.emit('order.opened', {
      order: orderOpened,
    });
    return orderOpened;
  }

  async updateOrder(
    id: string,
    updateData: UpdateOrderDto,
  ): Promise<OrderSummaryResponseDto> {
    const orderUpdated = await this.orderRepository.updateOrder(id, updateData);
    await this.eventEmitter.emit('order.updated', {
      order: orderUpdated,
    });
    return orderUpdated;
  }

  async deleteOrder(id: string): Promise<string> {
    const orderDeleted = await this.orderRepository.deleteOrder(id);
    await this.eventEmitter.emit('order.deleted', {
      order: orderDeleted,
    });
    return orderDeleted;
  }

  async getAllOrders(page: number, limit: number): Promise<Order[]> {
    return await this.orderRepository.getAllOrders(page, limit);
  }

  async getOrderById(id: string): Promise<Order> {
    return await this.orderRepository.getOrderById(id);
  }

  async getOrderDetails(page: number, limit: number): Promise<OrderDetails[]> {
    return await this.orderRepository.getOrderDetails(page, limit);
  }
  async getOrdersForOpenOrPendingTables(): Promise<Order[]> {
    return await this.orderRepository.getOrdersForOpenOrPendingTables();
  }

  async markOrderAsPendingPayment(id: string): Promise<Order> {
    return await this.orderRepository.markOrderAsPendingPayment(id);
  }

  async closeOrder(id: string): Promise<Order> {
    return await this.orderRepository.closeOrder(id);
  }

  async cancelOrder(id: string, updateData: UpdateOrderDto): Promise<Order> {
    return await this.orderRepository.cancelOrder(id, updateData);
  }
}
