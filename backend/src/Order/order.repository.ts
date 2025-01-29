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
import { TableState } from 'src/Enums/states.enum';
import { OrderOpenDto } from 'src/DTOs/create-orderOpen.dto';

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

  async openOrder(openOrder: CreateOrderDto): Promise<OrderOpenDto> {
    const { tableId, numberCustomers, comment } = openOrder;

    try {
      const tableInUse = await this.tableRepository.findOne({
        where: { id: tableId, isActive: true },
      });

      if (!tableInUse) {
        throw new NotFoundException(`Table with ID: ${tableId} not found`);
      }

      tableInUse.state = TableState.OPEN; //pasar por updateTable
      await this.tableRepository.save(tableInUse);

      const newOrder = this.orderRepository.create({
        date: new Date(),
        total: 0,
        numberCustomers: numberCustomers,
        table: tableInUse,
        comment: comment,
        orderDetails: [],
      });

      const savedOrder = await this.orderRepository.save(newOrder);

      const responseOrder = {
        date: savedOrder.date,
        total: savedOrder.total,
        numberCustomers: savedOrder.numberCustomers,
        comment: savedOrder.comment,
        tableId: savedOrder.table.id, // Aquí se reemplaza table con tableId
        orderDetails: savedOrder.orderDetails,
        commandNumber: savedOrder.commandNumber,
        id: savedOrder.id,
        state: savedOrder.state,
        isActive: savedOrder.isActive,
      };

      console.log('Order created:', responseOrder);
      return responseOrder as OrderOpenDto;
    } catch (error) {
      console.error(`[CreateOrder Error]: ${error.message}`, error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An error occurred while creating the order. Please try again later.',
      );
    }
  }

  async createOrder(orderToCreate: CreateOrderDto): Promise<Order> {
    const { tableId, numberCustomers, productsDetails, comment } =
      orderToCreate;

    try {
      const tableInUse = await this.tableRepository.findOne({
        where: { id: tableId, isActive: true },
      });

      if (!tableInUse) {
        throw new NotFoundException(`Table with ID: ${tableId} not found`);
      }

      tableInUse.state = TableState.OPEN; //pasar por updateTable
      await this.tableRepository.save(tableInUse);

      tableInUse.state = TableState.OPEN; //pasar por updateTable
      await this.tableRepository.save(tableInUse);

      const newOrder = this.orderRepository.create({
        date: new Date(),
        total: 0,
        numberCustomers: numberCustomers,
        table: tableInUse,
        comment: comment,
        comment: comment,
        orderDetails: [],
      });

      let total = 0;

      for (const { productId, quantity } of productsDetails) {
        const productFinded = await this.productRepository.findOne({
          where: { id: productId, isActive: true },
        });

        if (!productFinded) {
          throw new NotFoundException(
            `Product with ID: ${productId} not found`,
          );
        }

        const newOrderDetail = this.orderDetailsRepository.create({
          quantity: quantity,
          unitaryPrice: productFinded.price,
          subtotal: quantity * productFinded.price,
          product: productFinded,
        });
        total += newOrderDetail.subtotal;
        newOrder.orderDetails.push(newOrderDetail);
      }

      newOrder.total = total;
      return await this.orderRepository.save(newOrder);
    } catch (error) {
      console.error(`[CreateOrder Error]: ${error.message}`, error);

      if (error instanceof NotFoundException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An error occurred while creating the order. Please try again later.',
      );
    }
  }
  async updateOrder(id: string, updateData: UpdateOrderDto): Promise<Order> {
    console.log(id);
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

      if (updateData.state) {
        order.state = updateData.state;
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
        const updatedDetails = [];
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

          const existingDetail = order.orderDetails.find(
            (detail) => detail.product && detail.product.id === productId,
          );

          if (existingDetail) {
            if (quantity > 0) {
              existingDetail.quantity = quantity;
              existingDetail.unitaryPrice = product.price;
              existingDetail.subtotal = quantity * product.price;
              updatedDetails.push(existingDetail);
            } else {
              await this.orderDetailsRepository.remove(existingDetail);
            }
          } else if (quantity > 0) {
            const newDetail = this.orderDetailsRepository.create({
              quantity,
              unitaryPrice: product.price,
              subtotal: quantity * product.price,
              product,
              order,
            });
            updatedDetails.push(newDetail);
          }

          if (quantity > 0) {
            total += quantity * product.price;
          }
        }

        order.orderDetails = updatedDetails;
        order.total = total;
      }

      return await this.orderRepository.save(order);
    } catch (error) {
      console.error(`[UpdateOrder Error]: ${error.message}`, error);

      if (error instanceof NotFoundException) {
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
}
