import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { Repository } from 'typeorm';
import { CreateOrderDto } from 'src/DTOs/create-order.dto';
import { UpdateOrderDto } from 'src/DTOs/update-order.dto';
import { OrderDetails } from './order_details.entity';

@Injectable()
export class OrderRepository {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderDetails)
    private readonly orderDetailsRepository: Repository<OrderDetails>,
  ) {}

  async createOrder(order: CreateOrderDto): Promise<Order> {
    try {
      return await this.orderRepository.save(order);
    } catch (error) {
      throw new InternalServerErrorException(
        'Error creating the order.',
        error,
      );
    }
  }

  async updateOrder(id: string, updateData: UpdateOrderDto): Promise<Order> {
    if (!id) {
      throw new BadRequestException('Either ID must be provided.');
    }
    try {
      const order = await this.orderRepository.findOne({
        where: { id, isActive: true },
      });
      if (!order) {
        throw new BadRequestException(`Order with ID: ${id} not found`);
      }
      Object.assign(order, updateData);
      return await this.orderRepository.save(order);
    } catch (error) {
      throw new InternalServerErrorException(
        'Error updating the order.',
        error,
      );
    }
  }

  async deleteOrder(id: string): Promise<string> {
    if (!id) {
      throw new BadRequestException('Either ID must be provided.');
    }
    try {
      const result = await this.orderRepository.update(id, { isActive: false });
      if (result.affected === 0) {
        throw new NotFoundException(`Order with ID: ${id} not found`);
      }
      return 'Order successfully deleted';
    } catch (error) {
      throw new InternalServerErrorException(
        'Error deleting the order.',
        error,
      );
    }
  }

  async getAllOrders(page: number, limit: number): Promise<Order[]> {
    if (page <= 0 || limit <= 0) {
      throw new BadRequestException(
        'Page and limit must be positive integers.',
      );
    }
    try {
      return await this.orderRepository.find({
        where: { isActive: true },
        skip: (page - 1) * limit,
        take: limit,
      });
    } catch (error) {
      throw new InternalServerErrorException('Error fetching orders', error);
    }
  }

  async getOrderById(id: string): Promise<Order> {
    if (!id) {
      throw new BadRequestException('Either ID must be provided.');
    }
    try {
      const order = await this.orderRepository.findOne({
        where: { id, isActive: true },
      });
      if (!order) {
        throw new NotFoundException(`Order with ID: ${id} not found`);
      }
      return order;
    } catch (error) {
      throw new InternalServerErrorException('Error fetching the order', error);
    }
  }
}
