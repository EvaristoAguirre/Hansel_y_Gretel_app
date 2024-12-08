import { Injectable } from '@nestjs/common';
import { OrderRepository } from './order.repository';
import { CreateOrderDto } from 'src/DTOs/create-order.dto';
import { Order } from './order.entity';
import { UpdateOrderDto } from 'src/DTOs/update-order.dto';

@Injectable()
export class OrderService {
  constructor(private readonly orderRepository: OrderRepository) {}

  async createOrder(order: CreateOrderDto): Promise<Order> {
    return this.orderRepository.createOrder(order);
  }

  async updateOrder(id: string, updateData: UpdateOrderDto): Promise<Order> {
    return await this.orderRepository.updateOrder(id, updateData);
  }

  async deleteOrder(id: string): Promise<string> {
    return await this.orderRepository.deleteOrder(id);
  }

  async getAllOrders(page: number, limit: number): Promise<Order[]> {
    return await this.orderRepository.getAllOrders(page, limit);
  }

  async getOrderById(id: string): Promise<Order> {
    return await this.orderRepository.getOrderById(id);
  }
}
