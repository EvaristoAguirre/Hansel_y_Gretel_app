import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { QueryRunner, Repository } from 'typeorm';
import { OrderDetails } from './order_details.entity';
import { Table } from 'src/Table/table.entity';
import { Product } from 'src/Product/product.entity';
import { OrderState, TableState } from 'src/Enums/states.enum';
import { OrderSummaryResponseDto } from 'src/DTOs/orderSummaryResponse.dto';
import { ProductLineDto, ToppingSummaryDto } from 'src/DTOs/productSummary.dto';
import { CloseOrderDto } from 'src/DTOs/close-order.dto';
import { DailyCash } from 'src/daily-cash/daily-cash.entity';
import { Ingredient } from 'src/Ingredient/ingredient.entity';
import { OrderDetailToppings } from './order_details_toppings.entity';
import { ProductAvailableToppingGroup } from 'src/Ingredient/productAvailableToppingsGroup.entity';
import { OrderDetailsDto } from 'src/DTOs/order-details.dto';

@Injectable()
export class OrderRepository {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
  ) {}

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

  async closeOrder(
    id: string,
    closeOrderDto: CloseOrderDto,
    openDailyCash: DailyCash,
  ): Promise<OrderSummaryResponseDto> {
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

    if (!closeOrderDto.total || closeOrderDto.total <= 0) {
      throw new BadRequestException(`Total amount must be greater than 0`);
    }

    if (!closeOrderDto.methodOfPayment) {
      throw new BadRequestException(`Method of payment must be provided`);
    }

    if (!openDailyCash) {
      throw new ConflictException(
        'No open daily cash report found. Cannot close the order.',
      );
    }

    // -------- revisar si el ticket esta generando un numero y guardarlo en la orden

    order.methodOfPayment = closeOrderDto.methodOfPayment;
    order.dailyCash = openDailyCash;
    order.state = OrderState.CLOSED;
    order.table.state = TableState.AVAILABLE;

    await this.tableRepository.save(order.table);
    await this.orderRepository.save(order);

    const responseAdapted = await this.adaptResponse(order);
    return responseAdapted;
  }

  async getOrderWithRelations(id: string, qr: QueryRunner): Promise<Order> {
    return await qr.manager.findOne(Order, {
      where: { id, isActive: true },
      relations: [
        'orderDetails',
        'table',
        'table.room',
        'orderDetails.product',
        'orderDetails.orderDetailToppings',
        'orderDetails.orderDetailToppings.topping',
      ],
    });
  }

  async buildOrderDetailWithToppings(
    order: Order,
    product: Product,
    detailData: OrderDetailsDto,
    qr: QueryRunner,
  ): Promise<{
    detail: OrderDetails;
    toppingDetails: OrderDetailToppings[];
    subtotal: number;
  }> {
    const detail = qr.manager.create(OrderDetails, {
      quantity: detailData.quantity,
      unitaryPrice: product.price,
      subtotal: product.price * detailData.quantity,
      product,
      order,
    });

    const toppingDetails: OrderDetailToppings[] = [];

    if (product.allowsToppings && detailData.toppingsIds?.length) {
      for (const toppingId of detailData.toppingsIds) {
        const topping = await qr.manager.findOne(Ingredient, {
          where: { id: toppingId, isActive: true },
          relations: ['toppingsGroups'],
        });

        const toppingGroup = topping.toppingsGroups?.[0];

        const config = await qr.manager.findOne(ProductAvailableToppingGroup, {
          where: {
            product: { id: product.id },
            toppingGroup: { id: toppingGroup.id },
          },
          relations: ['unitOfMeasure'],
        });

        const td = qr.manager.create(OrderDetailToppings, {
          topping,
          orderDetails: detail,
          quantity: config.quantityOfTopping,
          unitOfMeasure: config.unitOfMeasure,
          unitOfMeasureName: config.unitOfMeasure?.name,
        });

        toppingDetails.push(td);
      }
    }

    return {
      detail,
      toppingDetails,
      subtotal: detail.subtotal,
    };
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
    response.total = Number(order.total);
    response.methodOfPayment = order.methodOfPayment;
    response.products = productLines;

    return response;
  }
}
