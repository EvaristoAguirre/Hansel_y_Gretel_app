import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from '../entities/order.entity';
import { QueryRunner, Repository } from 'typeorm';
import { OrderDetails } from '../entities/order_details.entity';
import { Table } from 'src/Table/table.entity';
import { Product } from 'src/Product/entities/product.entity';
import { OrderState, TableState } from 'src/Enums/states.enum';
import { OrderSummaryResponseDto } from 'src/DTOs/orderSummaryResponse.dto';
import { ProductLineDto, ToppingSummaryDto } from 'src/DTOs/productSummary.dto';
import { CloseOrderDto } from 'src/DTOs/close-order.dto';
import { DailyCash } from 'src/daily-cash/daily-cash.entity';
import { Ingredient } from 'src/Ingredient/ingredient.entity';
import { OrderDetailToppings } from '../entities/order_details_toppings.entity';
import { ProductAvailableToppingGroup } from 'src/Ingredient/productAvailableToppingsGroup.entity';
import { OrderDetailsDto } from 'src/DTOs/order-details.dto';
import { Logger } from '@nestjs/common';
import { OrderPayment } from '../entities/order_payment.entity';
import { LoggerService } from 'src/Monitoring/monitoring-logger.service';

@Injectable()
export class OrderRepository {
  private readonly logger = new Logger(OrderRepository.name);
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
    @InjectRepository(OrderPayment)
    private readonly orderPaymentRepository: Repository<OrderPayment>,
    private readonly loggerService: LoggerService,
  ) {}

  /**
   * Método auxiliar para loguear errores con información estructurada
   * Centraliza el formato de logs para este repositorio
   */
  private logError(
    operation: string,
    context: Record<string, any>,
    error: any,
  ) {
    const errorInfo = {
      operation,
      repository: 'OrderRepository',
      context,
      timestamp: new Date().toISOString(),
    };
    this.loggerService.error(errorInfo, error);
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
      this.logError('getOrdersForOpenOrPendingTables', {}, error);
      throw error;
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

    if (!closeOrderDto.payments || !closeOrderDto.payments.length) {
      throw new BadRequestException(`At least one payment must be provided`);
    }

    if (!openDailyCash) {
      throw new ConflictException(
        'No open daily cash report found. Cannot close the order.',
      );
    }

    const totalPayments = closeOrderDto.payments.reduce(
      (acc, payment) => acc + payment.amount,
      0,
    );

    if (totalPayments !== closeOrderDto.total) {
      throw new BadRequestException(
        `Total amount of payments (${totalPayments}) does not match the order total (${closeOrderDto.total})`,
      );
    }

    order.dailyCash = openDailyCash;
    order.state = OrderState.CLOSED;
    order.closedAt = new Date();
    order.table.state = TableState.AVAILABLE;

    const orderPayments = closeOrderDto.payments.map((p) =>
      this.orderPaymentRepository.create({
        order,
        amount: p.amount,
        methodOfPayment: p.methodOfPayment,
      }),
    );

    const totalConsumed = order.orderDetails.reduce(
      (acc, detail) => acc + Number(detail.subtotal),
      0,
    );

    const declaredTotal = Number(closeOrderDto.total);
    const calculatedTip = declaredTotal - totalConsumed;

    if (calculatedTip < 0) {
      throw new BadRequestException(
        `The declared total (${declaredTotal}) is less than the consumed amount (${totalConsumed}). This implies a negative tip.`,
      );
    }

    order.total = totalConsumed;
    order.tip = calculatedTip;

    await this.orderPaymentRepository.save(orderPayments);

    await this.tableRepository.save(order.table);
    await this.orderRepository.save(order);

    const updatedOrder = await this.orderRepository.findOne({
      where: { id: order.id },
      relations: ['orderDetails', 'table', 'orderDetails.product', 'payments'],
    });
    const responseAdapted = await this.adaptResponse(updatedOrder);
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
        'payments',
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
    const quantity = detailData.quantity;

    const toppingDetails: OrderDetailToppings[] = [];

    let totalExtraCost = 0;

    console.log(
      `🔍 [DEBUG] buildOrderDetailWithToppings - Producto: ${product.name}, Cantidad: ${quantity}`,
    );
    console.log(
      `🔍 [DEBUG] toppingsPerUnit recibidos:`,
      JSON.stringify(detailData.toppingsPerUnit, null, 2),
    );

    if (product.allowsToppings && detailData.toppingsPerUnit?.length) {
      if (detailData.toppingsPerUnit.length !== quantity) {
        throw new BadRequestException(
          `La cantidad de unidades (${quantity}) no coincide con el número de arreglos de toppings (${detailData.toppingsPerUnit.length})`,
        );
      }

      for (let unitIndex = 0; unitIndex < quantity; unitIndex++) {
        const toppingsForUnit = detailData.toppingsPerUnit[unitIndex];
        console.log(
          `🔍 [DEBUG] Procesando unidad ${unitIndex}, toppings:`,
          JSON.stringify(toppingsForUnit, null, 2),
        );

        for (const toppingId of toppingsForUnit) {
          const topping = await qr.manager.findOne(Ingredient, {
            where: { id: toppingId, isActive: true },
            relations: ['toppingsGroups'],
          });

          if (!topping) {
            throw new NotFoundException(
              `Topping con ID ${toppingId} no encontrado`,
            );
          }

          const toppingGroup = topping.toppingsGroups?.[0];
          if (!toppingGroup) {
            throw new BadRequestException(
              `El topping ${topping.name} no tiene grupo de topping asignado`,
            );
          }

          const config = await qr.manager.findOne(
            ProductAvailableToppingGroup,
            {
              where: {
                product: { id: product.id },
                toppingGroup: { id: toppingGroup.id },
              },
              relations: ['unitOfMeasure'],
            },
          );

          if (!config) {
            throw new BadRequestException(
              `El producto ${product.name} no tiene configuración para el grupo de topping del ingrediente ${topping.name}`,
            );
          }

          if (
            config.settings?.chargeExtra &&
            typeof config.settings.extraCost === 'number'
          ) {
            totalExtraCost += Number(config.settings.extraCost);
          }

          const td = qr.manager.create(OrderDetailToppings, {
            topping,
            orderDetails: null,
            unitOfMeasure: config.unitOfMeasure,
            unitOfMeasureName: config.unitOfMeasure?.name,
            unitIndex: unitIndex,
          });

          console.log(
            `🔍 [DEBUG] Topping creado - Nombre: ${topping.name}, Unidad: ${unitIndex}, Costo extra: ${config.settings?.extraCost || 0}`,
          );
          toppingDetails.push(td);
        }
      }
    }

    const unitaryToppingsCost = totalExtraCost / quantity;
    const unitaryPrice = Number(product.price) + Number(unitaryToppingsCost);
    const subtotal = unitaryPrice * quantity;

    const detail = qr.manager.create(OrderDetails, {
      quantity,
      unitaryPrice,
      subtotal,
      toppingsExtraCost: totalExtraCost,
      product,
      order,
    });

    return {
      detail,
      toppingDetails,
      subtotal,
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
    response.products = productLines;
    response.payments = (order.payments || []).map((p) => ({
      amount: Number(p.amount),
      methodOfPayment: p.methodOfPayment,
    }));
    response.total = Number(order.total);

    return response;
  }
}
