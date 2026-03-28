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
import { ProductLineDto } from 'src/DTOs/productSummary.dto';
import { buildProductLines } from '../helpers/order-response.helper';
import { TableService } from 'src/Table/table.service';
import { isUUID } from 'class-validator';
import { DailyCashService } from 'src/daily-cash/daily-cash.service';
import { Table } from 'src/Table/table.entity';
import { Product } from 'src/Product/entities/product.entity';
import { StockService } from 'src/Stock/stock.service';
import { Logger } from '@nestjs/common';
import { PrinterService } from 'src/Printer/printer.service';
import { transferOrderData } from 'src/Order/dtos/transfer-order.dto';
import { OrderDetailsDto } from 'src/DTOs/daily-cash-detail.dto';
import { PromotionSlot } from 'src/Product/entities/promotion-slot.entity';
import { PromotionSlotAssignment } from 'src/Product/entities/promotion-slot-assignment.entity';
import { OrderPromotionSelection } from '../entities/order-promotion-selection.entity';
import { OrderReaderService } from './order-reader.service';
import { Ingredient } from '@/Ingredient/ingredient.entity';
import { PromotionSelectionDto } from '@/Product/dtos/promotion-selection.dto';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,

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
      if (updateData.state) {
        order.state = updateData.state;
      }

      if (updateData.productsDetails?.length) {
        let total = 0;
        const detailsToSave: OrderDetails[] = [];
        const printProducts: any[] = [];

        for (const pd of updateData.productsDetails) {
          const product = await queryRunner.manager.findOne(Product, {
            where: { id: pd.productId, isActive: true },
          });
          if (!product) throw new NotFoundException('Product not found');

          let finalPrice = product.price;
          let extraCost = 0;

          if (product.type === 'promotion' && pd.promotionSelections?.length) {
            // Calcular costos para las selecciones premium
            // Agrupar selecciones por slotId para validar cantidad total
            const selectionsBySlot = new Map<string, PromotionSelectionDto[]>();

            for (const selection of pd.promotionSelections) {
              const slotId = selection.slotId;
              if (!selectionsBySlot.has(slotId)) {
                selectionsBySlot.set(slotId, []);
              }
              selectionsBySlot.get(slotId)!.push(selection);
            }

            // Validar cantidad total por slot y calcular costos
            for (const [slotId, slotSelections] of selectionsBySlot.entries()) {
              // Obtener TODAS las asignaciones del slot para esta promoción
              const assignments = await queryRunner.manager.find(
                PromotionSlotAssignment,
                {
                  where: {
                    promotionId: product.id,
                    slotId: slotId,
                  },
                },
              );

              if (!assignments || assignments.length === 0) {
                throw new BadRequestException(
                  `Slot ${slotId} is not assigned to promotion ${product.id}`,
                );
              }

              // Sumar las quantities de todas las asignaciones de este slot
              const totalRequiredQuantity = assignments.reduce(
                (sum, assignment) => sum + assignment.quantity,
                0,
              );

              // Contar el total de productos seleccionados para este slot
              const totalProductsSelected = slotSelections.reduce(
                (sum, sel) => sum + (sel.selectedProductIds?.length || 0),
                0,
              );

              // Validar que la cantidad total de productos seleccionados coincida con la suma de quantities
              if (totalProductsSelected !== totalRequiredQuantity) {
                throw new BadRequestException(
                  `Slot "${slotId}" requires ${totalRequiredQuantity} product(s), but ${totalProductsSelected} were provided`,
                );
              }

              // Obtener el slot con sus opciones
              const slot = await queryRunner.manager.findOne(PromotionSlot, {
                where: { id: slotId, isActive: true },
                relations: ['options'],
              });

              if (!slot) {
                throw new NotFoundException(`Slot with ID ${slotId} not found`);
              }

              // Calcular costo extra por cada producto seleccionado
              // Cada selección puede tener 1 o más productos (aunque en frontend será 1)
              for (const selection of slotSelections) {
                for (const selectedProductId of selection.selectedProductIds ||
                  []) {
                  const option = slot.options.find(
                    (o) => o.productId === selectedProductId && o.isActive,
                  );

                  if (!option) {
                    throw new BadRequestException(
                      `Product ${selectedProductId} is not a valid option for slot ${slotId}`,
                    );
                  }

                  if (option.extraCost > 0) {
                    extraCost += option.extraCost;
                  }
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
            // Agrupar selecciones por slotId para validar cantidad total
            const selectionsBySlot = new Map<string, PromotionSelectionDto[]>();

            for (const selection of pd.promotionSelections) {
              const slotId = selection.slotId;
              if (!selectionsBySlot.has(slotId)) {
                selectionsBySlot.set(slotId, []);
              }
              selectionsBySlot.get(slotId)!.push(selection);
            }

            // Validar y procesar cada slot
            for (const [slotId, slotSelections] of selectionsBySlot.entries()) {
              // Obtener TODAS las asignaciones del slot para esta promoción
              const assignments = await queryRunner.manager.find(
                PromotionSlotAssignment,
                {
                  where: {
                    promotionId: product.id,
                    slotId: slotId,
                  },
                },
              );

              if (!assignments || assignments.length === 0) {
                throw new BadRequestException(
                  `Slot ${slotId} is not assigned to promotion ${product.id}`,
                );
              }

              // Sumar las quantities de todas las asignaciones de este slot
              const totalRequiredQuantity = assignments.reduce(
                (sum, assignment) => sum + assignment.quantity,
                0,
              );

              // Contar el total de productos seleccionados para este slot
              const totalProductsSelected = slotSelections.reduce(
                (sum, sel) => sum + (sel.selectedProductIds?.length || 0),
                0,
              );

              // Validar que la cantidad total de productos seleccionados coincida con la suma de quantities
              if (totalProductsSelected !== totalRequiredQuantity) {
                throw new BadRequestException(
                  `Slot "${slotId}" requires ${totalRequiredQuantity} product(s), but ${totalProductsSelected} were provided`,
                );
              }

              // Obtener el slot con sus opciones
              const slot = await queryRunner.manager.findOne(PromotionSlot, {
                where: { id: slotId, isActive: true },
                relations: ['options'],
              });

              if (!slot) {
                throw new NotFoundException(`Slot with ID ${slotId} not found`);
              }

              // Crear un registro de OrderPromotionSelection por cada selección individual
              // Cada selección puede tener 1 o más productos (aunque en frontend será 1)
              for (const selection of slotSelections) {
                for (const selectedProductId of selection.selectedProductIds ||
                  []) {
                  const option = slot.options?.find(
                    (o) => o.productId === selectedProductId && o.isActive,
                  );

                  if (!option) {
                    throw new BadRequestException(
                      `Product ${selectedProductId} is not a valid option for slot ${slotId}`,
                    );
                  }

                  const promotionSelection = queryRunner.manager.create(
                    OrderPromotionSelection,
                    {
                      orderDetail: savedOrderDetail,
                      slotId: slotId,
                      selectedProductId: selectedProductId,
                      extraCostApplied: option.extraCost || 0,
                    },
                  );
                  await queryRunner.manager.save(promotionSelection);
                }
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
          total += Number(subtotal);

          // 🖨️ Construir datos de impresión para este producto específico
          if (product.type === 'promotion' && pd.promotionSelections?.length) {
            // LÓGICA PARA PROMOCIONES CON SLOTS
            // Generar un ID único para agrupar productos de esta promoción
            const promotionGroupId = `promo-${Date.now()}-${Math.random()}`;

            // Iterar sobre cada unidad de la promoción
            for (let unitIndex = 0; unitIndex < detail.quantity; unitIndex++) {
              // Para cada selección de slot en esta unidad
              // NOTA: Cada selección representa un producto individual con sus toppings
              for (
                let selectionIndex = 0;
                selectionIndex < pd.promotionSelections.length;
                selectionIndex++
              ) {
                const selection = pd.promotionSelections[selectionIndex];

                // Obtener el slot para el nombre
                const slot = await queryRunner.manager.findOne(PromotionSlot, {
                  where: { id: selection.slotId },
                });

                // Iterar sobre cada producto en la selección
                // En la estructura del frontend, cada selección tiene 1 producto
                for (
                  let productIndex = 0;
                  productIndex < (selection.selectedProductIds || []).length;
                  productIndex++
                ) {
                  const selectedProductId =
                    selection.selectedProductIds[productIndex];
                  const selectedProduct = await queryRunner.manager.findOne(
                    Product,
                    {
                      where: { id: selectedProductId },
                    },
                  );

                  if (!selectedProduct) {
                    continue;
                  }

                  // Obtener los toppings de este producto específico desde la selección
                  // En la estructura del frontend, toppingsPerUnit será un array con un solo elemento [toppings]
                  const toppingsForThisProduct =
                    selection.toppingsPerUnit?.[productIndex] || [];

                  // Obtener los nombres de los toppings
                  const toppingNames: string[] = [];
                  if (toppingsForThisProduct.length > 0) {
                    for (const toppingId of toppingsForThisProduct) {
                      const topping = await queryRunner.manager.findOne(
                        Ingredient,
                        {
                          where: { id: toppingId },
                        },
                      );
                      if (topping) {
                        toppingNames.push(topping.name);
                      }
                    }
                  }

                  // Construir el nombre completo: "Promoción - Producto Seleccionado"
                  const displayName = `${product.name} - ${selectedProduct.name}`;

                  // Si hay múltiples productos en el mismo slot, agregar el nombre del slot
                  const finalName =
                    (selection.selectedProductIds || []).length > 1
                      ? `${displayName} (${slot?.name || 'Slot'})`
                      : displayName;

                  const productToPrint = {
                    name: finalName,
                    quantity: 1,
                    commentOfProduct:
                      unitIndex === 0 &&
                      selectionIndex === 0 &&
                      productIndex === 0
                        ? detail.commentOfProduct
                        : undefined,
                    toppings: toppingNames,
                    promotionGroup: promotionGroupId, // Agregar ID del grupo de promoción
                  };

                  printProducts.push(productToPrint);
                }
              }
            }
          } else {
            // LÓGICA PARA PRODUCTOS NORMALES (sin slots)
            for (let unitIndex = 0; unitIndex < detail.quantity; unitIndex++) {
              const toppingsForThisUnit = toppingDetails
                .filter((t) => t.unitIndex === unitIndex)
                .map((t) => t.topping.name);

              const productToPrint = {
                name: product.name,
                quantity: 1,
                commentOfProduct:
                  unitIndex === 0 ? detail.commentOfProduct : undefined,
                toppings: toppingsForThisUnit,
              };

              printProducts.push(productToPrint);
            }
          }
        }

        // 🖨️ Generar número de comanda (una sola vez)
        const printData = {
          numberCustomers: order.numberCustomers,
          table: order.table?.name || 'SIN MESA',
          products: printProducts,
          isPriority: updateData.isPriority,
        };

        let commandNumber: string | null = null;

        try {
          if (process.env.NODE_ENV === 'production') {
            commandNumber =
              await this.printerService.printKitchenOrder(printData);
          } else {
            console.debug(
              `📤 Enviando comanda a impresión para mesa ${printData.table}`,
            );
            commandNumber = 'grabandoTextFijo - 1111111111';
          }
          this.printerService.logger.log(
            `✅ Comanda impresa, número: ${commandNumber}`,
          );
        } catch (printError) {
          this.printerService.logger.error(
            '❌ Falló la impresión de la comanda',
            printError.stack,
          );
        }

        // 💾 Guardar detalles (cascade: true en orderDetailToppings persiste los toppings automáticamente)
        this.logger.log(
          `[updateOrder] Guardando ${detailsToSave.length} detalle(s) de pedido`,
        );
        for (const detail of detailsToSave) {
          detail.commandNumber = commandNumber;
          this.logger.log(
            `[updateOrder] Guardando detail: producto="${detail.product?.name}", cantidad=${detail.quantity}, toppings asignados=${detail.orderDetailToppings?.length ?? 0}`,
          );
          const savedDetail = await queryRunner.manager.save(detail);
          this.logger.log(
            `[updateOrder] Detail guardado con id=${savedDetail.id} | toppings en DB: ${savedDetail.orderDetailToppings?.length ?? 'no cargados aún'}`,
          );
          order.orderDetails.push(savedDetail);
        }

        order.total = Number(order.total) + total;
      }

      await queryRunner.manager.save(order);

      await queryRunner.commitTransaction();

      // Recargar la orden con todas las relaciones necesarias para construir
      // los precios por unidad correctamente en adaptResponse.
      const updatedOrder = await this.orderRepo.findOne({
        where: { id: order.id },
        relations: [
          'orderDetails',
          'table',
          'orderDetails.product',
          'orderDetails.orderDetailToppings',
          'orderDetails.orderDetailToppings.topping',
          'payments',
        ],
      });

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

  async reprintKitchenOrder(orderId: string): Promise<string> {
    if (!isUUID(orderId)) {
      throw new BadRequestException('Invalid order ID format.');
    }

    const order = await this.orderRepo.findOne({
      where: { id: orderId, isActive: true },
      relations: [
        'table',
        'orderDetails',
        'orderDetails.product',
        'orderDetails.orderDetailToppings',
        'orderDetails.orderDetailToppings.topping',
        'orderDetails.promotionSelections',
        'orderDetails.promotionSelections.selectedProduct',
        'orderDetails.promotionSelections.slot',
      ],
    });

    if (!order) {
      throw new NotFoundException(`Order with ID: ${orderId} not found`);
    }

    const printProducts: any[] = [];

    for (const detail of order.orderDetails.filter((d) => d.isActive)) {
      const isPromoWithSlots =
        detail.product?.type === 'promotion' &&
        detail.promotionSelections?.length > 0;

      if (isPromoWithSlots) {
        const promotionGroupId = `reprint-promo-${detail.id}`;
        for (let unitIndex = 0; unitIndex < detail.quantity; unitIndex++) {
          for (const selection of detail.promotionSelections) {
            const selectedName = selection.selectedProduct?.name || 'Producto';
            const displayName = `${detail.product.name} - ${selectedName}`;
            printProducts.push({
              name: displayName,
              quantity: 1,
              commentOfProduct:
                unitIndex === 0 ? detail.commentOfProduct : undefined,
              toppings: [],
              promotionGroup: promotionGroupId,
            });
          }
        }
      } else {
        for (let unitIndex = 0; unitIndex < detail.quantity; unitIndex++) {
          const toppingsForUnit = (detail.orderDetailToppings ?? [])
            .filter((t) => t.unitIndex === unitIndex)
            .map((t) => t.topping?.name)
            .filter(Boolean);

          printProducts.push({
            name: detail.product?.name || 'Producto',
            quantity: 1,
            commentOfProduct:
              unitIndex === 0 ? detail.commentOfProduct : undefined,
            toppings: toppingsForUnit,
          });
        }
      }
    }

    const printData = {
      numberCustomers: order.numberCustomers,
      table: order.table?.name || 'SIN MESA',
      products: printProducts,
    };

    if (process.env.NODE_ENV === 'production') {
      return await this.printerService.printKitchenOrder(printData);
    } else {
      this.logger.log(
        `🔁 [DEV] Simulando reimpresión de comanda para mesa ${printData.table}`,
      );
      return 'reimpresion-simulada-dev';
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
          'orderDetails.orderDetailToppings',
          'orderDetails.orderDetailToppings.topping',
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

      if (process.env.NODE_ENV === 'production') {
        try {
          await this.printerService.printTicketOrder(order);
        } catch (error) {
          this.logger.error('printTicketOrder', error);
          throw error;
        }
      } else {
        console.log('simulando impresion de ticket');
        console.log('orderPending to print ticket', orderPending);
      }

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
          'orderDetails.product',
          'orderDetails.orderDetailToppings',
          'orderDetails.orderDetailToppings.topping',
          'orderDetails.promotionSelections',
          'table',
          'table.room',
        ],
      });

      if (!order) {
        throw new NotFoundException(`Order with ID: ${id} not found`);
      }

      if (order.state === OrderState.CLOSED) {
        throw new ConflictException('Closed orders cannot be cancelled.');
      }

      if (order.state === OrderState.CANCELLED) {
        throw new ConflictException('Order is already cancelled.');
      }

      // Restituir stock de cada ítem activo dentro de la misma transacción
      const activeDetails = (order.orderDetails ?? []).filter(
        (d) => d.isActive,
      );

      for (const detail of activeDetails) {
        if (!detail.product) {
          this.logger.warn(
            `[cancelOrder] Detail ${detail.id} sin producto asociado, omitiendo restitución de stock.`,
          );
          continue;
        }

        // Reconstruir toppingsPerUnit agrupando por unitIndex
        const toppingsPerUnit: string[][] = [];
        for (const toppingRecord of detail.orderDetailToppings ?? []) {
          const idx = toppingRecord.unitIndex;
          if (!toppingsPerUnit[idx]) toppingsPerUnit[idx] = [];
          if (toppingRecord.topping?.id) {
            toppingsPerUnit[idx].push(toppingRecord.topping.id);
          }
        }

        // Reconstruir promotionSelections agrupando por slotId
        let promotionSelections: PromotionSelectionDto[] | undefined;
        if (detail.promotionSelections?.length) {
          const slotMap = new Map<string, string[]>();
          for (const sel of detail.promotionSelections) {
            if (!slotMap.has(sel.slotId)) slotMap.set(sel.slotId, []);
            slotMap.get(sel.slotId).push(sel.selectedProductId);
          }
          promotionSelections = [...slotMap.entries()].map(
            ([slotId, selectedProductIds]) => ({ slotId, selectedProductIds }),
          );
        }

        try {
          await this.stockService.restoreStock(
            detail.product.id,
            detail.quantity,
            toppingsPerUnit.length ? toppingsPerUnit : undefined,
            promotionSelections,
            queryRunner,
          );
          this.logger.log(
            `[cancelOrder] Stock restituido: producto "${detail.product.name}" x${detail.quantity}`,
          );
        } catch (stockError) {
          // Modo lenient: registrar el error pero continuar con los demás ítems
          this.logger.warn(
            `[cancelOrder] No se pudo restituir stock del producto "${detail.product.name}" ` +
              `(ID: ${detail.product.id}): ${stockError.message}`,
          );
        }
      }

      const previousTableId = order.table?.id;

      // Guardar información de la mesa antes de establecerla en null
      const tableInfo = order.table ? { id: order.table.id } : null;

      if (order.table) {
        order.table = null;
      }

      order.state = OrderState.CANCELLED;
      order.isActive = false;

      const updatedOrder = await queryRunner.manager.save(order);

      // Commit único: restitución de stock + cancelación de orden
      await queryRunner.commitTransaction();

      // Cambiar estado de mesa (fuera de la transacción, tolerado)
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

      const orderWithTableInfo = {
        ...updatedOrder,
        table: tableInfo,
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
      productLines.push(...buildProductLines(detail));
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
    response.tip = Number(order.tip);
    response.discountPercent = Number(order.discountPercent ?? 0);
    response.discountAmount = Number(order.discountAmount ?? 0);

    return response;
  }
}
