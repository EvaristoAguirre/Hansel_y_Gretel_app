import { Injectable } from '@nestjs/common';
import { OrderRepository } from './order.repository';
import { CreateOrderDto } from 'src/DTOs/create-order.dto';
import { Order } from './order.entity';
import { UpdateOrderDto } from 'src/DTOs/update-order.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderDetails } from './order_details.entity';

@Injectable()
export class OrderService {
  constructor(
    private readonly orderRepository: OrderRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async createOrder(orderToCreate: CreateOrderDto): Promise<Order> {
    const orderCreated = await this.orderRepository.createOrder(orderToCreate);
    await this.eventEmitter.emit('order.created', {
      order: orderCreated,
    });
    return orderCreated;
  }

  async updateOrder(id: string, updateData: UpdateOrderDto): Promise<Order> {
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
}
