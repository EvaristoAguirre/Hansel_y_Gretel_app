import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { Between, DataSource, Repository } from 'typeorm';
import { CreateOrderDto } from 'src/DTOs/create-order.dto';
import { UpdateOrderDto } from 'src/DTOs/update-order.dto';
import { OrderDetails } from './order_details.entity';
import { Table } from 'src/Table/table.entity';
import { Product } from 'src/Product/product.entity';
import { DailyCashState, OrderState, TableState } from 'src/Enums/states.enum';
import { OrderSummaryResponseDto } from 'src/DTOs/orderSummaryResponse.dto';
import { ProductLineDto, ToppingSummaryDto } from 'src/DTOs/productSummary.dto';
import { StockService } from 'src/Stock/stock.service';
import { isUUID } from 'class-validator';
import { PrinterService } from 'src/Printer/printer.service';
import { TableService } from 'src/Table/table.service';
import { CloseOrderDto } from 'src/DTOs/close-order.dto';
import { DailyCash } from 'src/daily-cash/daily-cash.entity';
import { Ingredient } from 'src/Ingredient/ingredient.entity';
import { OrderDetailToppings } from './order_details_toppings.entity';
import { ProductAvailableToppingGroup } from 'src/Ingredient/productAvailableToppingsGroup.entity';

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
    @InjectRepository(DailyCash)
    private readonly dailyCashRepository: Repository<DailyCash>,
    private readonly dataSource: DataSource,
    private readonly stockService: StockService,
    private readonly printerService: PrinterService,
    private readonly tableService: TableService,
  ) {}

  async openOrder(
    orderToCreate: CreateOrderDto,
  ): Promise<OrderSummaryResponseDto> {
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

      await this.orderRepository.save(newOrder);
      const responseAdapted = await this.adaptResponse(newOrder);
      return responseAdapted;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'An error occurred while creating the order. Please try again later.',
      );
    }
  }

  async updateOrder(
    id: string,
    updateData: UpdateOrderDto,
  ): Promise<OrderSummaryResponseDto> {
    if (!id) {
      throw new BadRequestException('Order ID must be provided.');
    }
    if (!isUUID(id)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
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
          'orderDetails.orderDetailToppings',
          'orderDetails.orderDetailToppings.topping',
        ],
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

      if (updateData.tableId) {
        const table = await queryRunner.manager.findOne(Table, {
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
        const newProducts = [];
        let total = 0;

        for (const {
          productId,
          toppingsIds,
          quantity,
        } of updateData.productsDetails) {
          const product = await queryRunner.manager.findOne(Product, {
            where: { id: productId, isActive: true },
          });

          if (!product) {
            throw new NotFoundException(
              `Product with ID: ${productId} not found`,
            );
          }

          await this.stockService.deductStock(product.id, quantity);

          const newDetail = queryRunner.manager.create(OrderDetails, {
            quantity,
            unitaryPrice: product.price,
            subtotal: quantity * product.price,
            product,
            order,
          });

          newDetail.orderDetailToppings = [];

          if (product.allowsToppings && toppingsIds.length) {
            for (const toppingId of toppingsIds) {
              const topping = await queryRunner.manager.findOne(Ingredient, {
                where: { id: toppingId, isActive: true },
                relations: ['toppingsGroups'],
              });

              if (!topping) {
                throw new NotFoundException(
                  `Topping with ID: ${toppingId} not found`,
                );
              }

              // Buscar grupo de toppings que pertenece este topping
              const toppingGroup = topping.toppingsGroups?.[0];

              if (!toppingGroup) {
                throw new NotFoundException(
                  `Topping ${topping.name} no tiene grupo asignado.`,
                );
              }

              // Buscar la configuración del grupo para este producto
              const config = await queryRunner.manager.findOne(
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
                throw new NotFoundException(
                  `No se encontró configuración del grupo ${toppingGroup.name} para el producto ${product.name}`,
                );
              }

              // await this.stockService.deductStock(topping.id, quantity * config.quantityOfTopping);
              await queryRunner.manager.save(newDetail);
              const toppingDetail = queryRunner.manager.create(
                OrderDetailToppings,
                {
                  topping,
                  orderDetails: newDetail,
                  quantity: config.quantityOfTopping,
                  unitOfMeasure: config.unitOfMeasure,
                  unitOfMeasureName: config.unitOfMeasure?.name,
                },
              );

              newDetail.orderDetailToppings.push(toppingDetail);
              try {
                await queryRunner.manager.save(toppingDetail);
              } catch (e) {
                console.error('🔥 Error guardando toppingDetail:', e);
                throw e;
              }
            }
          }
          order.orderDetails = [...order.orderDetails, newDetail];

          newProducts.push(product);

          total += quantity * product.price;
        }

        order.total = (Number(order.total) || 0) + total;

        // if (newProducts.length > 0) {
        //   try {
        //     const printData = {
        //       numberCustomers: order.numberCustomers,
        //       table: order.table?.name || 'SIN MESA',
        //       products: updateData.productsDetails
        //         .filter((detail) =>
        //           newProducts.some((p) => p.id === detail.productId),
        //         )
        //         .map((detail) => ({
        //           name:
        //             newProducts.find((p) => p.id === detail.productId)?.name ||
        //             'Producto',
        //           quantity: detail.quantity,
        //           commentOfProduct: detail.commentOfProduct,
        //         })),
        //       isPriority: updateData.isPriority,
        //     };

        //     this.printerService.logger.log(
        //       `Attempting to print order for table ${printData.table}`,
        //     );
        //     const commandNumber =
        //       await this.printerService.printKitchenOrder(printData);
        //     order.commandNumber = commandNumber;
        //     this.printerService.logger.log('Print job sent successfully');
        //   } catch (printError) {
        //     this.printerService.logger.error(
        //       'Failed to print kitchen order',
        //       printError.stack,
        //     );
        //   }
        // }
      }
      console.log(
        '🧾 Detalles actuales antes de guardar:',
        order.orderDetails.map((d) => ({
          id: d.id,
          product: d.product?.name,
          toppings: d.orderDetailToppings?.map((t) => t.topping?.name),
        })),
      );
      const updatedOrder = await queryRunner.manager.save(order);

      await queryRunner.commitTransaction();

      const responseAdapted = await this.adaptResponse(updatedOrder);
      return responseAdapted;
    } catch (error) {
      await queryRunner.rollbackTransaction();

      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Error updating the order. Please try again later.',
        error.message,
      );
    } finally {
      await queryRunner.release();
    }
  }

  async deleteOrder(id: string): Promise<string> {
    if (!id) {
      throw new BadRequestException('Either ID must be provided.');
    }
    if (!isUUID(id)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
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
        relations: [
          'table',
          'orderDetails',
          'orderDetails.product',
          'orderDetails.orderDetailToppings',
          'orderDetails.orderDetailToppings.topping',
        ],
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
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
      const order = await this.orderRepository.findOne({
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
      if (error instanceof HttpException) throw error;
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

  async markOrderAsPendingPayment(
    id: string,
  ): Promise<OrderSummaryResponseDto> {
    if (!isUUID(id)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
    }
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
      order.table.state = TableState.PENDING_PAYMENT;
      await this.tableRepository.save(order.table);
      await this.orderRepository.save(order);

      // try {
      //   await this.printerService.printTicketOrder(order);
      // } catch (error) {
      //   throw new ConflictException(error.message);
      // }

      const responseAdapted = await this.adaptResponse(order);
      return responseAdapted;
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

  async closeOrder(
    id: string,
    closeOrderDto: CloseOrderDto,
  ): Promise<OrderSummaryResponseDto> {
    if (!isUUID(id)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
    }
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

      if (!closeOrderDto.total || closeOrderDto.total <= 0) {
        throw new BadRequestException(`Total amount must be greater than 0`);
      }

      if (!closeOrderDto.methodOfPayment) {
        throw new BadRequestException(`Method of payment must be provided`);
      }

      // -------- revisar si el ticket esta generando un numero y guardarlo en la orden
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const openDailyCash = await this.dailyCashRepository.findOne({
        where: {
          date: Between(startOfDay, endOfDay),
          state: DailyCashState.OPEN,
        },
      });

      if (!openDailyCash) {
        throw new ConflictException(
          'No open daily cash report found. Cannot close the order.',
        );
      }
      order.methodOfPayment = closeOrderDto.methodOfPayment;
      order.dailyCash = openDailyCash;
      order.state = OrderState.CLOSED;
      order.table.state = TableState.AVAILABLE;

      await this.tableRepository.save(order.table);
      await this.orderRepository.save(order);
      await this.dailyCashRepository.save(openDailyCash);

      const responseAdapted = await this.adaptResponse(order);
      return responseAdapted;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error closing the order. Please try again later.',
      );
    }
  }

  async cancelOrder(id: string): Promise<Order> {
    if (!id) {
      throw new BadRequestException('Order ID must be provided.');
    }
    if (!isUUID(id)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();

    try {
      await queryRunner.startTransaction();

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
        throw new ConflictException(
          'This order is closed. It cannot be cancelled.',
        );
      }

      const previousTableId = order.table?.id;
      if (order.table) {
        order.table = null;
      }

      order.state = OrderState.CANCELLED;

      const updatedOrder = await queryRunner.manager.save(order);

      await queryRunner.commitTransaction();

      if (previousTableId) {
        await this.tableService.updateTableState(
          previousTableId,
          TableState.AVAILABLE,
        );
      }

      return updatedOrder;
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error canceling the order. Please try again later.',
      );
    } finally {
      await queryRunner.release();
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
    response.total = Number(order.total);
    response.methodOfPayment = order.methodOfPayment;
    response.products = productLines;

    return response;
  }
}
