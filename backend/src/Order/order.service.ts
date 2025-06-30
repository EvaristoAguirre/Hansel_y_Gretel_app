import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { OrderRepository } from './order.repository';
import { CreateOrderDto } from 'src/DTOs/create-order.dto';
import { Order } from './order.entity';
import { UpdateOrderDto } from 'src/DTOs/update-order.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderDetails } from './order_details.entity';
import { OrderSummaryResponseDto } from 'src/DTOs/orderSummaryResponse.dto';
import { CloseOrderDto } from 'src/DTOs/close-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { OrderState, TableState } from 'src/Enums/states.enum';
import { ProductLineDto, ToppingSummaryDto } from 'src/DTOs/productSummary.dto';
import { TableService } from 'src/Table/table.service';
import { isUUID } from 'class-validator';
import { DailyCashService } from 'src/daily-cash/daily-cash.service';
import { Table } from 'src/Table/table.entity';
import { Product } from 'src/Product/product.entity';
import { StockService } from 'src/Stock/stock.service';
import { Logger } from '@nestjs/common';
import { PrinterService } from 'src/Printer/printer.service';
import { OrderDetailToppings } from './order_details_toppings.entity';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(OrderDetails)
    private readonly orderDetailsRepo: Repository<OrderDetails>,
    private readonly orderRepository: OrderRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly tableService: TableService,
    private readonly dailyCashService: DailyCashService,
    private readonly dataSource: DataSource,
    private readonly stockService: StockService,
    private readonly printerService: PrinterService,
  ) {}

  async openOrder(
    orderToCreate: CreateOrderDto,
  ): Promise<OrderSummaryResponseDto> {
    const { tableId, numberCustomers, comment } = orderToCreate;

    try {
      const tableInUse = await this.tableService.getTableById(tableId);

      if (!tableInUse) {
        throw new NotFoundException(`Table with ID: ${tableId} not found`);
      }

      if (tableInUse.state !== TableState.AVAILABLE) {
        throw new ConflictException(`Table with ID: ${tableId} not available`);
      }

      await this.tableService.updateTableState(tableId, TableState.OPEN);

      const newOrder = this.orderRepo.create({
        date: new Date(),
        total: 0,
        numberCustomers: numberCustomers,
        table: tableInUse,
        comment: comment,
        orderDetails: [],
        isActive: true,
      });

      await this.orderRepo.save(newOrder);

      this.eventEmitter.emit('order.created', {
        order: newOrder,
      });

      const responseAdapted = await this.adaptResponse(newOrder);
      return responseAdapted;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'An error occurred while creating the order. Please try again later.',
      );
    }
  }

  async updateOrder(
    id: string,
    updateData: UpdateOrderDto,
  ): Promise<OrderSummaryResponseDto> {
    if (!id) throw new BadRequestException('Order ID must be provided.');
    if (!isUUID(id)) throw new BadRequestException('Invalid UUID');
    console.log('entrando a updateOrder', updateData.productsDetails);
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await this.orderRepository.getOrderWithRelations(
        id,
        queryRunner,
      );
      if (!order || !order.isActive)
        throw new NotFoundException('Order not found');
      if (order.state === OrderState.CLOSED)
        throw new ConflictException('Order is closed');
      if (updateData.state && updateData.state !== OrderState.OPEN) {
        throw new ConflictException('Only "OPEN" orders can be modified');
      }
      if (updateData.tableId) {
        const table = await queryRunner.manager.findOne(Table, {
          where: { id: updateData.tableId, isActive: true },
        });
        if (!table) throw new NotFoundException('Table not found');
        order.table = table;
      }

      if (updateData.numberCustomers)
        order.numberCustomers = updateData.numberCustomers;
      if (updateData.state) order.state = updateData.state;

      if (updateData.productsDetails?.length) {
        let total = 0;
        const detailsToSave: OrderDetails[] = [];
        const toppingsToSave: OrderDetailToppings[] = [];

        for (const pd of updateData.productsDetails) {
          const product = await queryRunner.manager.findOne(Product, {
            where: { id: pd.productId, isActive: true },
          });
          if (!product) throw new NotFoundException('Product not found');
          console.log('datos a product type....', product.type);
          await this.stockService.deductStock(
            product.id,
            pd.quantity,
            pd.toppingsPerUnit,
          );

          const { detail, toppingDetails, subtotal } =
            await this.orderRepository.buildOrderDetailWithToppings(
              order,
              product,
              pd,
              queryRunner,
            );
          detail.commentOfProduct = pd.commentOfProduct;
          detailsToSave.push(detail);
          toppingsToSave.push(...toppingDetails);
          total += Number(subtotal);
        }

        // 🖨️ Generar número de comanda (una sola vez)
        const printData = {
          numberCustomers: order.numberCustomers,
          table: order.table?.name || 'SIN MESA',
          products: detailsToSave.flatMap((detail) => {
            return Array.from({ length: detail.quantity }, (_, index) => {
              const toppingsForThisUnit = toppingsToSave
                .filter(
                  (t) =>
                    t.orderDetails?.product.id === detail.product.id &&
                    t.unitIndex === index,
                )
                .map((t) => t.topping.name);

              return {
                name: detail.product.name,
                quantity: 1,
                commentOfProduct:
                  index === 0 ? detail.commentOfProduct : undefined,
                toppings: toppingsForThisUnit,
              };
            });
          }),
          isPriority: updateData.isPriority,
        };

        let commandNumber: string | null = null;

        try {
          console.log(
            `📤 Enviando comanda a impresión para mesa ${printData.table}`,
          );
          console.log('info enviada a imprimir.......', printData);
          // commandNumber =
          //   await this.printerService.printKitchenOrder(printData);
          commandNumber = 'grabandoTextFijo - 1111111111';
          this.printerService.logger.log(
            `✅ Comanda impresa, número: ${commandNumber}`,
          );
        } catch (printError) {
          this.printerService.logger.error(
            '❌ Falló la impresión de la comanda',
            printError.stack,
          );
        }

        // 💾 Guardar detalles y toppings con el número de comanda
        for (const detail of detailsToSave) {
          detail.commandNumber = commandNumber;
          const savedDetail = await queryRunner.manager.save(detail);

          for (const topping of toppingsToSave.filter(
            (t) => t.orderDetails?.product.id === detail.product.id,
          )) {
            topping.orderDetails = savedDetail;
            await queryRunner.manager.save(topping);
          }

          order.orderDetails.push(savedDetail);
        }

        order.total = Number(order.total) + total;
      }

      const updatedOrder = await queryRunner.manager.save(order);

      await queryRunner.commitTransaction();

      this.eventEmitter.emit('order.updated', { order: updatedOrder });

      return await this.adaptResponse(updatedOrder);
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err instanceof HttpException
        ? err
        : new InternalServerErrorException('Error updating order', err.message);
    } finally {
      await queryRunner.release();
    }
  }

  async deleteOrder(id: string): Promise<string> {
    if (!id) {
      throw new BadRequestException('Order ID must be provided.');
    }

    if (!isUUID(id)) {
      throw new BadRequestException('Invalid ID format.');
    }

    const result = await this.orderRepo.update(id, { isActive: false });

    if (result.affected === 0) {
      throw new NotFoundException(`Order with ID: ${id} not found`);
    }

    this.eventEmitter.emit('order.deleted', { orderId: id });

    return 'Order successfully deleted';
  }

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
        ],
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Error fetching orders',
        error.message,
      );
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
        ],
      });
      if (!order) {
        throw new NotFoundException(`Order with ID: ${id} not found`);
      }

      const responseAdapted = await this.adaptResponse(order);
      return responseAdapted;
    } catch (error) {
      if (error instanceof HttpException) throw error;
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
      return await this.orderDetailsRepo.find({
        where: { isActive: true },
        skip: (page - 1) * limit,
        take: limit,
        relations: ['product', 'order'],
      });
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Error fetching orders',
        error.message,
      );
    }
  }

  async getOrdersForOpenOrPendingTables(): Promise<Order[]> {
    return await this.orderRepository.getOrdersForOpenOrPendingTables();
  }

  async markOrderAsPendingPayment(
    id: string,
  ): Promise<OrderSummaryResponseDto> {
    if (!isUUID(id)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
    }
    try {
      const order = await this.orderRepo.findOne({
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
      order.table.state = TableState.PENDING_PAYMENT;
      await this.tableService.updateTableState(
        order.table.id,
        TableState.PENDING_PAYMENT,
      );
      const orderPending = await this.orderRepo.save(order);

      // try {
      //   await this.printerService.printTicketOrder(order);
      // } catch (error) {
      //   throw new ConflictException(error.message);
      // }

      this.eventEmitter.emit('order.updatePending', {
        order: orderPending,
      });

      const responseAdapted = await this.adaptResponse(orderPending);

      return responseAdapted;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Error marking order as pending payment. Please try again later.',
      );
    }
  }

  async closeOrder(
    id: string,
    closeOrderDto: CloseOrderDto,
  ): Promise<OrderSummaryResponseDto> {
    if (!isUUID(id)) {
      throw new BadRequestException('Invalid ID format');
    }

    if (!closeOrderDto.total || closeOrderDto.total <= 0) {
      throw new BadRequestException('Total amount must be greater than 0');
    }

    if (!closeOrderDto.methodOfPayment) {
      throw new BadRequestException('Payment method must be provided');
    }

    const openDailyCash = await this.dailyCashService.getTodayOpenDailyCash();
    if (!openDailyCash) {
      throw new ConflictException(
        'No open daily cash report found. Cannot close the order.',
      );
    }

    const closedOrder = await this.orderRepository.closeOrder(
      id,
      closeOrderDto,
      openDailyCash,
    );

    this.eventEmitter.emit('order.updateClose', { order: closedOrder });

    return closedOrder;
  }

  async cancelOrder(id: string): Promise<Order> {
    if (!id || !isUUID(id)) {
      throw new BadRequestException('Invalid or missing order ID.');
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await queryRunner.manager.findOne(Order, {
        where: { id, isActive: true },
        relations: [
          'orderDetails',
          'table',
          'table.room',
          'orderDetails.product',
        ],
      });

      if (!order) {
        throw new NotFoundException(`Order with ID: ${id} not found`);
      }

      if (order.state === OrderState.CLOSED) {
        throw new ConflictException('Closed orders cannot be cancelled.');
      }

      const previousTableId = order.table?.id;
      if (order.table) {
        order.table = null;
      }

      order.state = OrderState.CANCELLED;

      const updatedOrder = await queryRunner.manager.save(order);

      await queryRunner.commitTransaction();

      // Cambiar estado de mesa (fuera de la transacción)
      if (previousTableId) {
        try {
          await this.tableService.updateTableState(
            previousTableId,
            TableState.AVAILABLE,
          );
        } catch (err) {
          this.logger.warn(
            `⚠️ La orden ${id} fue cancelada, pero no se pudo actualizar el estado de la mesa ${previousTableId}: ${err.message}`,
          );
        }
      }

      return updatedOrder;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      if (error instanceof HttpException) throw error;

      throw new InternalServerErrorException(
        'Error cancelling the order.',
        error.message,
      );
    } finally {
      await queryRunner.release();
    }
  }

  // ----------------- respuesta adaptada
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
