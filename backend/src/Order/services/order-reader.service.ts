import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { OrderRepository } from '../repositories/order.repository';
import { Order } from '../entities/order.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { OrderSummaryResponseDto } from 'src/DTOs/orderSummaryResponse.dto';
import { isUUID } from 'class-validator';
import { ProductLineDto, ToppingSummaryDto } from 'src/DTOs/productSummary.dto';
import { OrderDetails } from '../entities/order_details.entity';
import { OrderDetailsDto } from 'src/DTOs/daily-cash-detail.dto';

@Injectable()
export class OrderReaderService {
  private readonly logger = new Logger(OrderReaderService.name);
  constructor(
    private readonly orderRepository: OrderRepository,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderDetails)
    private readonly orderDetailsRepo: Repository<OrderDetails>,
  ) {}

  async getAllOrders(page: number, limit: number): Promise<Order[]> {
    if (page <= 0 || limit <= 0) {
      throw new BadRequestException(
        'Page and limit must be positive integers.',
      );
    }
    try {
      return await this.orderRepo.find({
        where: { isActive: true },
        skip: (page - 1) * limit,
        take: limit,
        relations: [
          'table',
          'orderDetails',
          'orderDetails.product',
          'orderDetails.orderDetailToppings',
          'orderDetails.orderDetailToppings.topping',
          'payments',
        ],
      });
    } catch (error) {
      this.logger.error('getAllOrders', error);
      throw error;
    }
  }

  async getOrderById(id: string): Promise<OrderSummaryResponseDto> {
    if (!id) {
      throw new BadRequestException('Either ID must be provided.');
    }
    if (!isUUID(id)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
    }
    try {
      const order = await this.orderRepo.findOne({
        where: { id, isActive: true },
        relations: [
          'table',
          'table.room',
          'orderDetails',
          'orderDetails.product',
          'orderDetails.orderDetailToppings',
          'orderDetails.orderDetailToppings.topping',
          'payments',
        ],
      });
      if (!order) {
        throw new NotFoundException(`Order with ID: ${id} not found`);
      }

      const responseAdapted = await this.adaptResponse(order);
      return responseAdapted;
    } catch (error) {
      this.logger.error('getOrderById', error);
      throw error;
    }
  }

  async adaptResponse(order: Order): Promise<OrderSummaryResponseDto> {
    const productLines: ProductLineDto[] = [];

    for (const detail of order.orderDetails) {
      const toppings: ToppingSummaryDto[] =
        detail.orderDetailToppings?.map((t) => ({
          id: t.topping.id,
          name: t.topping.name,
        })) || [];

      productLines.push({
        productId: detail.product.id,
        productName: detail.product.name,
        quantity: detail.quantity,
        unitaryPrice: Number(detail.unitaryPrice),
        subtotal: Number(detail.subtotal),
        allowsToppings: detail.product.allowsToppings,
        commentOfProduct: detail.commentOfProduct || null,
        toppings,
      });
    }

    const response = new OrderSummaryResponseDto();
    response.id = order.id;
    response.state = order.state;
    response.numberCustomers = order.numberCustomers;
    response.comment = order.comment;
    response.table = {
      id: order.table.id,
      name: order.table.name,
      state: order.table.state,
    };
    response.products = productLines;
    response.payments = (order.payments || []).map((p) => ({
      amount: Number(p.amount),
      methodOfPayment: p.methodOfPayment,
    }));
    response.total = Number(order.total);

    return response;
  }

  async getOrderDetails(page: number, limit: number): Promise<OrderDetails[]> {
    if (page <= 0 || limit <= 0) {
      throw new BadRequestException(
        'Page and limit must be positive integers.',
      );
    }
    try {
      return await this.orderDetailsRepo.find({
        where: { isActive: true },
        skip: (page - 1) * limit,
        take: limit,
        relations: ['product', 'order'],
      });
    } catch (error) {
      this.logger.error('getOrderDetails', error);
      throw error;
    }
  }

  async getOrdersForOpenOrPendingTables(): Promise<Order[]> {
    return await this.orderRepository.getOrdersForOpenOrPendingTables();
  }

  async orderDetailsById(id: string): Promise<OrderDetailsDto> {
    if (!id) {
      throw new BadRequestException('Either ID must be provided.');
    }
    if (!isUUID(id)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
    }
    try {
      const order = await this.orderRepo.findOne({
        where: { id: id },
        relations: [
          'table',
          'table.room',
          'orderDetails',
          'orderDetails.product',
          'payments',
        ],
      });

      if (!order) {
        throw new NotFoundException(`Orden con ID ${id} no encontrada`);
      }

      const orderSummary = {
        id: order.id,
        date: order.date,
        table: order.table?.name || 'Sin mesa',
        room: order.table?.room?.name || 'Sin salón',
        numberCustomers: order.numberCustomers,
        total: Number(order.total).toFixed(2),
        createdAt: order.createdAt,
        updatedAt: order.updatedAt,
        closedAt: order.closedAt,
        paymentMethods: Array.isArray(order.payments)
          ? order.payments.map((p) => ({
              methodOfPayment: p.methodOfPayment,
              amount: Number(p.amount).toFixed(2),
            }))
          : [],
        products: Array.isArray(order.orderDetails)
          ? order.orderDetails.map((d) => ({
              name: d.product?.name || 'Producto eliminado',
              quantity: d.quantity,
              commandNumber: d.commandNumber,
            }))
          : [],
      };

      return orderSummary;
    } catch (error) {
      this.logger.error('orderDetailsById', error);
      throw error;
    }
  }
}
