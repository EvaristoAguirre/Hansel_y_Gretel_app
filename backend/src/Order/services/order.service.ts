import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OrderRepository } from '../repositories/order.repository';
import { CreateOrderDto } from 'src/Order/dtos/create-order.dto';
import { Order } from '../entities/order.entity';
import { UpdateOrderDto } from 'src/Order/dtos/update-order.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderDetails } from '../entities/order_details.entity';
import { OrderSummaryResponseDto } from 'src/Order/dtos/orderSummaryResponse.dto';
import { CloseOrderDto } from 'src/Order/dtos/close-order.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { OrderState, TableState } from 'src/Enums/states.enum';
import { ProductLineDto, ToppingSummaryDto } from 'src/DTOs/productSummary.dto';
import { TableService } from 'src/Table/table.service';
import { isUUID } from 'class-validator';
import { DailyCashService } from 'src/daily-cash/daily-cash.service';
import { Table } from 'src/Table/table.entity';
import { Product } from 'src/Product/entities/product.entity';
import { StockService } from 'src/Stock/stock.service';
import { Logger } from '@nestjs/common';
import { PrinterService } from 'src/Printer/printer.service';
import { OrderDetailToppings } from '../entities/order_details_toppings.entity';
import { transferOrderData } from 'src/Order/dtos/transfer-order.dto';
import { OrderDetailsDto } from 'src/DTOs/daily-cash-detail.dto';
import { PromotionSlot } from 'src/Product/entities/promotion-slot.entity';
import { PromotionSlotAssignment } from 'src/Product/entities/promotion-slot-assignment.entity';
import { OrderPromotionSelection } from '../entities/order-promotion-selection.entity';
import { OrderReaderService } from './order-reader.service';

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
    private readonly reader: OrderReaderService,
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
      this.logger.error('openOrder', error);
      throw error;
    }
  }

  async updateOrder(
    id: string,
    updateData: UpdateOrderDto,
  ): Promise<OrderSummaryResponseDto> {
    if (!id) throw new BadRequestException('Order ID must be provided.');
    if (!isUUID(id)) throw new BadRequestException('Invalid UUID');

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
        const printProducts: any[] = [];

        console.log(
          '🔍 [DEBUG] Productos recibidos en updateOrder:',
          JSON.stringify(updateData.productsDetails, null, 2),
        );

        for (const pd of updateData.productsDetails) {
          const product = await queryRunner.manager.findOne(Product, {
            where: { id: pd.productId, isActive: true },
          });
          if (!product) throw new NotFoundException('Product not found');

          let finalPrice = product.price;
          let extraCost = 0;

          if (product.type === 'promotion' && pd.promotionSelections?.length) {
            // Calcular costos para las selecciones premium
            for (const selection of pd.promotionSelections) {
              // Obtener la asignación del slot para esta promoción (para obtener quantity)
              const assignment = await queryRunner.manager.findOne(
                PromotionSlotAssignment,
                {
                  where: {
                    promotionId: product.id,
                    slotId: selection.slotId,
                  },
                },
              );

              if (!assignment) {
                throw new BadRequestException(
                  `Slot ${selection.slotId} is not assigned to promotion ${product.id}`,
                );
              }

              // Validar que la cantidad de productos seleccionados coincida con quantity
              if (
                !selection.selectedProductIds ||
                selection.selectedProductIds.length !== assignment.quantity
              ) {
                throw new BadRequestException(
                  `Slot "${selection.slotId}" requires ${assignment.quantity} product(s), but ${selection.selectedProductIds?.length || 0} were provided`,
                );
              }

              // Obtener el slot con sus opciones
              const slot = await queryRunner.manager.findOne(PromotionSlot, {
                where: { id: selection.slotId, isActive: true },
                relations: ['options'],
              });

              if (!slot) {
                throw new NotFoundException(
                  `Slot with ID ${selection.slotId} not found`,
                );
              }

              // Calcular costo extra por cada producto seleccionado
              for (const selectedProductId of selection.selectedProductIds) {
                const option = slot.options.find(
                  (o) => o.productId === selectedProductId && o.isActive,
                );

                if (!option) {
                  throw new BadRequestException(
                    `Product ${selectedProductId} is not a valid option for slot ${selection.slotId}`,
                  );
                }

                if (option.extraCost > 0) {
                  extraCost += option.extraCost;
                }
              }
            }
            finalPrice += extraCost;
          }

          //crear OrderDetail
          const orderDetail = queryRunner.manager.create(OrderDetails, {
            product,
            quantity: pd.quantity,
            unitaryPrice: finalPrice,
            subtotal: finalPrice * pd.quantity,
            // ... otros campos
          });
          const savedOrderDetail = await queryRunner.manager.save(orderDetail);

          // Guardar selecciones de promoción (crear un registro por cada producto seleccionado)
          if (product.type === 'promotion' && pd.promotionSelections?.length) {
            for (const selection of pd.promotionSelections) {
              // Obtener la asignación del slot para esta promoción
              const assignment = await queryRunner.manager.findOne(
                PromotionSlotAssignment,
                {
                  where: {
                    promotionId: product.id,
                    slotId: selection.slotId,
                  },
                },
              );

              if (!assignment) {
                throw new BadRequestException(
                  `Slot ${selection.slotId} is not assigned to promotion ${product.id}`,
                );
              }

              // Validar que la cantidad de productos seleccionados coincida con quantity
              if (
                !selection.selectedProductIds ||
                selection.selectedProductIds.length !== assignment.quantity
              ) {
                throw new BadRequestException(
                  `Slot "${selection.slotId}" requires ${assignment.quantity} product(s), but ${selection.selectedProductIds?.length || 0} were provided`,
                );
              }

              // Obtener el slot con sus opciones
              const slot = await queryRunner.manager.findOne(PromotionSlot, {
                where: { id: selection.slotId, isActive: true },
                relations: ['options'],
              });

              if (!slot) {
                throw new NotFoundException(
                  `Slot with ID ${selection.slotId} not found`,
                );
              }

              // Crear un registro de OrderPromotionSelection por cada producto seleccionado
              for (let i = 0; i < selection.selectedProductIds.length; i++) {
                const selectedProductId = selection.selectedProductIds[i];
                const option = slot.options?.find(
                  (o) => o.productId === selectedProductId && o.isActive,
                );

                if (!option) {
                  throw new BadRequestException(
                    `Product ${selectedProductId} is not a valid option for slot ${selection.slotId}`,
                  );
                }

                const promotionSelection = queryRunner.manager.create(
                  OrderPromotionSelection,
                  {
                    orderDetail: savedOrderDetail,
                    slotId: selection.slotId,
                    selectedProductId: selectedProductId,
                    extraCostApplied: option.extraCost || 0,
                  },
                );
                await queryRunner.manager.save(promotionSelection);
              }
            }
          }

          //------------------- Deducción de stock con soporte para promociones con slots
          await this.stockService.deductStock(
            product.id,
            pd.quantity,
            pd.toppingsPerUnit,
            pd.promotionSelections, // Pasar selecciones de promoción si aplica
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

          // 🖨️ Construir datos de impresión para este producto específico
          console.log(
            `🔍 [DEBUG] Construyendo printProducts para ${product.name}, cantidad: ${detail.quantity}`,
          );
          console.log(
            `🔍 [DEBUG] toppingDetails disponibles:`,
            toppingDetails.map((t) => ({
              name: t.topping.name,
              unitIndex: t.unitIndex,
            })),
          );

          for (let unitIndex = 0; unitIndex < detail.quantity; unitIndex++) {
            const toppingsForThisUnit = toppingDetails
              .filter((t) => t.unitIndex === unitIndex)
              .map((t) => t.topping.name);

            console.log(
              `🔍 [DEBUG] Unidad ${unitIndex} - toppings filtrados:`,
              toppingsForThisUnit,
            );

            printProducts.push({
              name: product.name,
              quantity: 1,
              commentOfProduct:
                unitIndex === 0 ? detail.commentOfProduct : undefined,
              toppings: toppingsForThisUnit,
            });
          }
        }

        // 🖨️ Generar número de comanda (una sola vez)
        const printData = {
          numberCustomers: order.numberCustomers,
          table: order.table?.name || 'SIN MESA',
          products: printProducts,
          isPriority: updateData.isPriority,
        };

        console.log(
          '🔍 [DEBUG] printData completo para impresión:',
          JSON.stringify(printData, null, 2),
        );
        console.log(
          '🔍 [DEBUG] printProducts detallado:',
          printProducts.map((p) => ({
            name: p.name,
            quantity: p.quantity,
            commentOfProduct: p.commentOfProduct,
            toppings: p.toppings,
          })),
        );

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
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('updateOrder', error);
      throw error;
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
    return await this.reader.getAllOrders(page, limit);
  }

  async getOrderById(id: string): Promise<OrderSummaryResponseDto> {
    return await this.reader.getOrderById(id);
  }

  async getOrderDetails(page: number, limit: number): Promise<OrderDetails[]> {
    return await this.reader.getOrderDetails(page, limit);
  }

  async getOrdersForOpenOrPendingTables(): Promise<Order[]> {
    return await this.reader.getOrdersForOpenOrPendingTables();
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
        relations: [
          'orderDetails',
          'table',
          'orderDetails.product',
          'payments',
        ],
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
      console.log('simulando impresion de ticket');
      console.log('orderPending to print ticket', orderPending);

      // Emitir evento de ticket impreso (paso 3 completado)
      this.eventEmitter.emit('order.ticketPrinted', {
        order: orderPending,
      });

      // Emitir evento de orden actualizada a pendiente de pago
      this.eventEmitter.emit('order.updatePending', {
        order: orderPending,
      });

      const responseAdapted = await this.adaptResponse(orderPending);

      return responseAdapted;
    } catch (error) {
      this.logger.error('markOrderAsPendingPayment', error);
      throw error;
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

      // Guardar información de la mesa antes de establecerla en null
      const tableInfo = order.table ? { id: order.table.id } : null;

      if (order.table) {
        order.table = null;
      }

      order.state = OrderState.CANCELLED;
      order.isActive = false; // Marcar como inactiva para que no aparezca en búsquedas

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

      // Emitir evento de orden cancelada para sincronización en tiempo real
      // Incluir información de la mesa antes de que se estableciera en null
      const orderWithTableInfo = {
        ...updatedOrder,
        table: tableInfo, // Incluir el tableId en el evento
      };

      this.eventEmitter.emit('order.deleted', { order: orderWithTableInfo });

      return updatedOrder;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('cancelOrder', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async transferOrder(
    orderId: string,
    transferOrder: transferOrderData,
  ): Promise<OrderSummaryResponseDto> {
    if (!orderId || !isUUID(orderId)) {
      throw new BadRequestException('Invalid or missing order ID.');
    }
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const currentTable = await queryRunner.manager.findOne(Table, {
        where: { id: transferOrder.fromTableId },
      });
      if (!currentTable || currentTable.isActive === false)
        throw new NotFoundException(`Table with ID not found`);

      const tableToTransfer = await queryRunner.manager.findOne(Table, {
        where: { id: transferOrder.toTableId },
      });

      if (!tableToTransfer || tableToTransfer.isActive === false)
        throw new NotFoundException(
          `Table with ID: ${tableToTransfer.id} not found`,
        );

      if (tableToTransfer.state !== TableState.AVAILABLE)
        throw new ConflictException(
          `Table with ID: ${tableToTransfer.id} is not available`,
        );

      const currentOrder = await queryRunner.manager.findOne(Order, {
        where: { id: orderId },
      });
      if (!currentOrder) {
        throw new NotFoundException(`Order with ID: ${orderId} not found`);
      }

      currentOrder.table = tableToTransfer;

      await queryRunner.manager.update(
        Table,
        { id: currentTable.id },
        { state: TableState.CLOSED },
      );
      await queryRunner.manager.update(
        Table,
        { id: tableToTransfer.id },
        { state: TableState.OPEN },
      );

      await queryRunner.manager.save(currentOrder);
      await queryRunner.commitTransaction();

      this.eventEmitter.emit('order.updated', { order: currentOrder });
      this.eventEmitter.emit('table.updated', { table: currentTable });
      this.eventEmitter.emit('table.updated', { table: tableToTransfer });

      return await this.getOrderById(currentOrder.id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error('transferOrder', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async orderDetailsById(id: string): Promise<OrderDetailsDto> {
    return await this.reader.orderDetailsById(id);
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
    response.products = productLines;
    response.payments = (order.payments || []).map((p) => ({
      amount: Number(p.amount),
      methodOfPayment: p.methodOfPayment,
    }));
    response.total = Number(order.total);

    return response;
  }
}
