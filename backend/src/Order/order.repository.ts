import {
  BadRequestException,
  ConflictException,
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
import { OrderState, TableState } from 'src/Enums/states.enum';

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
  ) { }
  async openOrder(orderToCreate: CreateOrderDto): Promise<Order> {
    const { tableId, numberCustomers, comment } = orderToCreate;

    try {
      const tableInUse = await this.tableRepository.findOne({
        where: { id: tableId, isActive: true },
      });

      if (!tableInUse) {
        throw new NotFoundException(`Table with ID: ${tableId} not found`);
      }

      if (tableInUse.state !== TableState.AVAILABLE) {
        throw new ConflictException(`Table with ID: ${tableId} not available`);
      }

      tableInUse.state = TableState.OPEN;
      await this.tableRepository.save(tableInUse);

      const newOrder = this.orderRepository.create({
        date: new Date(),
        total: 0,
        numberCustomers: numberCustomers,
        table: tableInUse,
        comment: comment,
        orderDetails: [],
        isActive: true,
      });

      return await this.orderRepository.save(newOrder);
    } catch (error) {
      console.error(`[CreateOrder Error]: ${error.message}`, error);

      if (
        error instanceof NotFoundException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An error occurred while creating the order. Please try again later.',
      );
    }
  }

  async updateOrder(id: string, updateData: UpdateOrderDto): Promise<Order> {
    if (!id) {
      throw new BadRequestException('Order ID must be provided.');
    }

    try {
      const order = await this.orderRepository.findOne({
        where: { id, isActive: true },
        relations: ['orderDetails', 'table', 'orderDetails.product'],
      });

      if (!order) {
        throw new NotFoundException(`Order with ID: ${id} not found`);
      }

      if (order.state === OrderState.CLOSED) {
        throw new ConflictException(
          'This order is closed. It cannot be modified.',
        );
      }

      if (updateData.state && updateData.state !== OrderState.OPEN) {
        throw new ConflictException(
          'Only orders with state "open" can be modified.',
        );
      }

      if (updateData.state) {
        order.state = updateData.state;
      }

      if (updateData.numberCustomers) {
        order.numberCustomers = updateData.numberCustomers;
      }

      if (updateData.comment) {
        order.comment = updateData.comment;
      }

      if (updateData.tableId) {
        const table = await this.tableRepository.findOne({
          where: { id: updateData.tableId, isActive: true },
        });
        if (!table) {
          throw new NotFoundException(
            `Table with ID: ${updateData.tableId} not found`,
          );
        }
        order.table = table;
      }

      if (updateData.productsDetails) {
        const batchId = Date.now().toString();
        const newProducts = [];
        let total = 0;

        for (const { productId, quantity } of updateData.productsDetails) {
          const product = await this.productRepository.findOne({
            where: { id: productId, isActive: true },
          });

          if (!product) {
            throw new NotFoundException(
              `Product with ID: ${productId} not found`,
            );
          }

          const newDetail = this.orderDetailsRepository.create({
            quantity,
            unitaryPrice: product.price,
            subtotal: quantity * product.price,
            product,
            order,
            batchId,
          });

          order.orderDetails.push(newDetail);
          newProducts.push(product);

          total += quantity * product.price;
        }

        order.total = (Number(order.total) || 0) + total;

        if (newProducts.length > 0) {
          console.log('emitiendo comanda para la tanda actual', {
            orderId: order.id,
            products: newProducts,
            batchId,
          });
          // this.eventEmitter.emit('order.updated', {
          //     orderId: order.id,
          //     products: newProducts,
          //     batchId,
          // });
        }
      }

      return await this.orderRepository.save(order);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Error updating the order. Please try again later.',
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
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
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
    try {
      return await this.orderRepository.find({
        where: { isActive: true },
        skip: (page - 1) * limit,
        take: limit,
        relations: ['orderDetails', 'orderDetails.product', 'table'],
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
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
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error fetching the order',
        error.message,
      );
    }
  }

  async getOrderDetails(page: number, limit: number): Promise<OrderDetails[]> {
    if (page <= 0 || limit <= 0) {
      throw new BadRequestException(
        'Page and limit must be positive integers.',
      );
    }
    try {
      return await this.orderDetailsRepository.find({
        where: { isActive: true },
        skip: (page - 1) * limit,
        take: limit,
        relations: ['product', 'order'],
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        'Error fetching orders',
        error.message,
      );
    }
  }

  async getOrdersForOpenOrPendingTables(): Promise<Order[]> {
    try {
      return this.orderRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.table', 'table')
        .where('table.state IN (:...states)', {
          states: ['open', 'pending_payment'],
        })
        .getMany();
    } catch (error) {
      throw new InternalServerErrorException(
        'Error fetching orders',
        error.message,
      );
    }
  }

  async markOrderAsPendingPayment(id: string): Promise<Order> {
    try {
      const order = await this.orderRepository.findOne({
        where: { id, isActive: true },
        relations: ['orderDetails', 'table', 'orderDetails.product'],
      });

      if (!order) {
        throw new NotFoundException(`Order with ID: ${id} not found`);
      }

      if (order.state !== OrderState.OPEN) {
        throw new BadRequestException(
          `Order with ID: ${id} is not in an open state`,
        );
      }

      order.state = OrderState.PENDING_PAYMENT;
      await this.orderRepository.save(order);

      // Emitir evento para generar el ticket
      // this.eventEmitter.emit('order.pendingPayment', { orderId: order.id });
      console.log('estoy emitiendo el ticket de la orden', {
        orderId: order.id,
      });
      return order;
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error marking order as pending payment. Please try again later.',
      );
    }
  }

  async closeOrder(id: string): Promise<Order> {
    try {
      const order = await this.orderRepository.findOne({
        where: { id, isActive: true },
        relations: ['orderDetails', 'table', 'orderDetails.product'],
      });

      if (!order) {
        throw new NotFoundException(`Order with ID: ${id} not found`);
      }

      if (order.state !== OrderState.PENDING_PAYMENT) {
        throw new BadRequestException(
          `Order with ID: ${id} is not in a pending payment state`,
        );
      }

      order.state = OrderState.CLOSED;
      order.table.state = TableState.AVAILABLE; // Liberar la mesa
      await this.tableRepository.save(order.table);
      await this.orderRepository.save(order);

      // Emitir evento para notificar que la orden ha sido cerrada
      // this.eventEmitter.emit('order.closed', { orderId: order.id });
      console.log('cambiando estado a orden cerrada', { orderId: order.id });
      console.log(order);
      return order;
    } catch (error) {
      console.error(`[CloseOrder Error]: ${error.message}`, error);

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Error closing the order. Please try again later.',
      );
    }
  }
}
