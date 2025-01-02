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
import { Table } from 'src/Table/table.entity';
import { Product } from 'src/Product/product.entity';

@Injectable()
export class OrderRepository {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderDetails)
    private readonly orderDetailsRepository: Repository<OrderDetails>,
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  async createOrder(orderToCreate: CreateOrderDto): Promise<Order> {
    const { tableId, numberCustomers, productsDetails } = orderToCreate;

    const tableInUse = await this.tableRepository.findOne({
      where: { id: tableId, isActive: true },
    });

    if (!tableInUse) {
      throw new NotFoundException(`Table with ID: ${tableId} not found`);
    }

    const newOrder = this.orderRepository.create({
      date: new Date(),
      total: 0,
      numberCustomers: numberCustomers,
      table: tableInUse,
      orderDetails: [],
    });

    for (const { productId, quantity, unitaryPrice } of productsDetails) {
      const productFinded = await this.productRepository.findOne({
        where: { id: productId, isActive: true },
      });

      if (!productFinded) {
        throw new NotFoundException(`Product with ID: ${productId} not found`);
      }

      const newOrderDetail = this.orderDetailsRepository.create({
        quantity: quantity,
        unitaryPrice: unitaryPrice,
        subtotal: quantity * unitaryPrice,
        product: productFinded,
        order: newOrder,
      });

      newOrder.orderDetails.push(newOrderDetail);
    }
    return await this.orderRepository.save(newOrder);
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
        error.message,
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
        error.message,
      );
    }
  }

  async getAllOrders(page: number, limit: number): Promise<Order[]> {
    if (page <= 0 || limit <= 0) {
      throw new BadRequestException(
        'Page and limit must be positive integers.',
      );
    }
    console.log(page, limit);
    try {
      return await this.orderRepository.find({
        where: { isActive: true },
        skip: (page - 1) * limit,
        take: limit,
        relations: ['orderDetails'],
      });
    } catch (error) {
      throw new InternalServerErrorException(
        'Error fetching orders',
        error.message,
      );
    }
  }

  async getOrderById(id: string): Promise<Order> {
    if (!id) {
      throw new BadRequestException('Either ID must be provided.');
    }
    try {
      const order = await this.orderRepository.findOne({
        where: { id, isActive: true },
        relations: ['orderDetails'],
      });
      if (!order) {
        throw new NotFoundException(`Order with ID: ${id} not found`);
      }
      return order;
    } catch (error) {
      throw new InternalServerErrorException(
        'Error fetching the order',
        error.message,
      );
    }
  }
}
