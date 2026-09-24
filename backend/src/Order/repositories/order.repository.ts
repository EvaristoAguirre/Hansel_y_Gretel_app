import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order } from '../entities/order.entity';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';
import { OrderDetails } from '../entities/order_details.entity';
import { Table } from 'src/Table/table.entity';
import { Product } from 'src/Product/entities/product.entity';
import { OrderState, TableState } from 'src/Enums/states.enum';
import { OrderSummaryResponseDto } from 'src/Order/dtos/orderSummaryResponse.dto';
import { ProductLineDto, ToppingSummaryDto } from 'src/DTOs/productSummary.dto';
import { buildProductLines } from '../helpers/order-response.helper';
import { CloseOrderDto } from 'src/Order/dtos/close-order.dto';
import { DailyCash } from 'src/daily-cash/daily-cash.entity';
import { Ingredient } from 'src/Ingredient/ingredient.entity';
import { OrderDetailToppings } from '../entities/order_details_toppings.entity';
import { ProductAvailableToppingGroup } from 'src/Ingredient/productAvailableToppingsGroup.entity';
import { OrderDetailsDto } from 'src/Order/dtos/order-details.dto';
import { Logger } from '@nestjs/common';
import { OrderPayment } from '../entities/order_payment.entity';

@Injectable()
export class OrderRepository {
  private readonly logger = new Logger(OrderRepository.name);
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly dataSource: DataSource,
  ) {}

  async getOrdersForOpenOrPendingTables(): Promise<Order[]> {
    try {
      return this.orderRepository
        .createQueryBuilder('order')
        .leftJoinAndSelect('order.table', 'table')
        .where('order.state IN (:...states)', {
          states: ['open', 'pending_payment'],
        })
        .andWhere('order.isActive = :isActive', { isActive: true })
        .getMany();
    } catch (error) {
      this.logger.error('getOrdersForOpenOrPendingTables', error);
      throw error;
    }
  }

  async closeOrder(
    id: string,
    closeOrderDto: CloseOrderDto,
    openDailyCash: DailyCash,
  ): Promise<OrderSummaryResponseDto> {
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

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const order = await queryRunner.manager.findOne(Order, {
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

      order.dailyCash = openDailyCash;
      order.state = OrderState.CLOSED;
      order.closedAt = new Date();
      order.table.state = TableState.AVAILABLE;

      const orderPayments = closeOrderDto.payments.map((p) =>
        queryRunner.manager.create(OrderPayment, {
          order,
          amount: p.amount,
          methodOfPayment: p.methodOfPayment,
        }),
      );

      const totalConsumed = order.orderDetails
        .filter((detail) => detail.isActive)
        .reduce((acc, detail) => acc + Number(detail.subtotal), 0);

      const totalConsumedNum = Number(totalConsumed);
      const grossRounded = Math.round(totalConsumedNum);
      const pctRaw = Number(closeOrderDto.discountPercent ?? 0);
      const discountPercent = Math.min(100, Math.max(0, Math.round(pctRaw)));

      let calculatedTip: number;
      let discountAmount = 0;

      if (discountPercent === 0) {
        discountAmount = 0;
        const declaredTotal = Number(closeOrderDto.total);
        calculatedTip = declaredTotal - totalConsumedNum;
        if (calculatedTip < 0) {
          throw new BadRequestException(
            `The declared total (${declaredTotal}) is less than the consumed amount (${totalConsumedNum}). This implies a negative tip.`,
          );
        }
      } else {
        discountAmount = Math.round((grossRounded * discountPercent) / 100);
        const netAfterDiscount = grossRounded - discountAmount;
        if (netAfterDiscount < 0) {
          throw new BadRequestException(
            'El descuento no puede superar el subtotal.',
          );
        }
        const declaredTotal = Math.round(Number(closeOrderDto.total));
        calculatedTip = declaredTotal - netAfterDiscount;
        if (calculatedTip < 0) {
          throw new BadRequestException(
            `El total cobrado (${declaredTotal}) es menor que el neto tras descuento (${netAfterDiscount}).`,
          );
        }
      }

      order.total = totalConsumed;
      order.tip = calculatedTip;
      order.discountPercent = discountPercent;
      order.discountAmount = discountAmount;

      await queryRunner.manager.save(orderPayments);
      await queryRunner.manager.save(order.table);
      await queryRunner.manager.save(order);

      const updatedOrder = await queryRunner.manager.findOne(Order, {
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

      await queryRunner.commitTransaction();
      return await this.adaptResponse(updatedOrder);
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      this.logger.error('closeOrder', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
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
    overrideBasePrice?: number,
  ): Promise<{
    detail: OrderDetails;
    toppingDetails: OrderDetailToppings[];
    subtotal: number;
  }> {
    try {
      const quantity = detailData.quantity;

      if (!quantity || quantity <= 0) {
        throw new BadRequestException(
          `La cantidad debe ser mayor a 0 para el producto "${product.name}".`,
        );
      }

      const toppingDetails: OrderDetailToppings[] = [];

      let totalExtraCost = 0;

      this.logger.log(
        `[buildOrderDetailWithToppings] Procesando producto: ${product.name}, Cantidad: ${quantity}`,
      );
      this.logger.debug(
        `[buildOrderDetailWithToppings] DTO completo recibido: ${JSON.stringify(detailData, null, 2)}`,
      );
      this.logger.debug(
        `[buildOrderDetailWithToppings] toppingsPerUnit: ${JSON.stringify(detailData.toppingsPerUnit)}`,
      );
      if (detailData.promotionSelections) {
        this.logger.debug(
          `[buildOrderDetailWithToppings] promotionSelections: ${JSON.stringify(detailData.promotionSelections)}`,
        );
      }

      const toppingIds = this.collectToppingIds(detailData);
      const selectedProductIds = this.collectSelectedProductIds(detailData);
      const toppingById = await this.loadToppingsById(qr, toppingIds);
      const selectedProductById = await this.loadProductsById(
        qr,
        selectedProductIds,
      );
      const configByKey = await this.loadToppingConfigsByProduct(
        qr,
        [product.id, ...selectedProductIds],
      );

      if (product.allowsToppings && detailData.toppingsPerUnit?.length) {
        const normalizedToppings: string[][] = Array.from(
          { length: quantity },
          (_, i) => detailData.toppingsPerUnit![i] ?? [],
        );

        for (let unitIndex = 0; unitIndex < quantity; unitIndex++) {
          const toppingsForUnit = normalizedToppings[unitIndex];
          this.logger.debug(
            `[buildOrderDetailWithToppings] Procesando unidad ${unitIndex}, toppings: ${JSON.stringify(toppingsForUnit)}`,
          );

          for (const toppingId of toppingsForUnit) {
            const topping = toppingById.get(toppingId);
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

            const config = configByKey.get(`${product.id}:${toppingGroup.id}`);
            if (!config) {
              throw new BadRequestException(
                `El producto ${product.name} no tiene configuración para el grupo de topping del ingrediente ${topping.name}`,
              );
            }

            const toppingExtraCost =
              config.settings?.chargeExtra &&
              typeof config.settings.extraCost === 'number'
                ? Number(config.settings.extraCost)
                : 0;

            if (toppingExtraCost > 0) {
              totalExtraCost += toppingExtraCost;
            }

            const td = qr.manager.create(OrderDetailToppings, {
              topping,
              unitOfMeasure: config.unitOfMeasure,
              unitOfMeasureName: config.unitOfMeasure?.name,
              unitIndex: unitIndex,
              extraCost: toppingExtraCost,
            });

            this.logger.debug(
              `[buildOrderDetailWithToppings] Topping creado - Nombre: ${topping.name}, Unidad: ${unitIndex}, Costo extra: ${toppingExtraCost}`,
            );
            toppingDetails.push(td);
          }
        }
      }

      if (
        detailData.promotionSelections &&
        detailData.promotionSelections.length > 0
      ) {
        this.logger.log(
          `[buildOrderDetailWithToppings] Procesando toppings de productos dentro de slots`,
        );

        for (let unitIndex = 0; unitIndex < quantity; unitIndex++) {
          for (const selection of detailData.promotionSelections) {
            if (
              !selection.toppingsPerUnit ||
              selection.toppingsPerUnit.length === 0
            ) {
              continue;
            }

            for (
              let productIndex = 0;
              productIndex < selection.selectedProductIds.length;
              productIndex++
            ) {
              const selectedProductId =
                selection.selectedProductIds[productIndex];
              const toppingsForThisProduct =
                selection.toppingsPerUnit[productIndex] || [];

              if (toppingsForThisProduct.length === 0) {
                continue;
              }

              const selectedProduct = selectedProductById.get(selectedProductId);
              if (!selectedProduct) {
                this.logger.warn(
                  `[buildOrderDetailWithToppings] Producto seleccionado ${selectedProductId} no encontrado`,
                );
                continue;
              }

              for (const toppingId of toppingsForThisProduct) {
                const topping = toppingById.get(toppingId);
                if (!topping) {
                  this.logger.warn(
                    `[buildOrderDetailWithToppings] Topping ${toppingId} no encontrado`,
                  );
                  continue;
                }

                const toppingGroup = topping.toppingsGroups?.[0];
                if (!toppingGroup) {
                  this.logger.warn(
                    `[buildOrderDetailWithToppings] El topping ${topping.name} no tiene grupo asignado`,
                  );
                  continue;
                }

                const config = configByKey.get(
                  `${selectedProduct.id}:${toppingGroup.id}`,
                );
                if (!config) {
                  this.logger.warn(
                    `[buildOrderDetailWithToppings] El producto ${selectedProduct.name} no tiene configuración para el grupo de topping ${toppingGroup.name}`,
                  );
                  continue;
                }

                const slotToppingExtraCost =
                  config.settings?.chargeExtra &&
                  typeof config.settings.extraCost === 'number'
                    ? Number(config.settings.extraCost)
                    : 0;

                if (slotToppingExtraCost > 0) {
                  totalExtraCost += slotToppingExtraCost;
                }

                const td = qr.manager.create(OrderDetailToppings, {
                  topping,
                  unitOfMeasure: config.unitOfMeasure,
                  unitOfMeasureName: config.unitOfMeasure?.name,
                  unitIndex: unitIndex,
                  extraCost: slotToppingExtraCost,
                });

                toppingDetails.push(td);
              }
            }
          }
        }
      }

      const unitaryToppingsCost = totalExtraCost / quantity;
      const basePrice = overrideBasePrice !== undefined
        ? Number(overrideBasePrice)
        : Number(product.price);
      const unitaryPrice = basePrice + Number(unitaryToppingsCost);
      const subtotal = unitaryPrice * quantity;

      this.logger.log(
        `[buildOrderDetailWithToppings] Resumen final - Producto: ${product.name} | Cantidad: ${quantity} | BasePrice: ${basePrice} | TotalExtraCost: ${totalExtraCost} | UnitaryPrice: ${unitaryPrice} | Subtotal: ${subtotal} | Toppings a guardar: ${toppingDetails.length}`,
      );
      toppingDetails.forEach((td, i) => {
        this.logger.debug(
          `[buildOrderDetailWithToppings] toppingDetails[${i}] => topping: ${td.topping?.name}, unitIndex: ${td.unitIndex}, extraCost: ${td.extraCost}`,
        );
      });

      const detail = qr.manager.create(OrderDetails, {
        quantity,
        unitaryPrice,
        subtotal,
        toppingsExtraCost: totalExtraCost,
        product,
        order,
        orderDetailToppings: toppingDetails,
      });

      this.logger.log(
        `[buildOrderDetailWithToppings] OrderDetails creado con ${detail.orderDetailToppings?.length ?? 0} toppings asignados (cascade)`,
      );

      return {
        detail,
        toppingDetails,
        subtotal,
      };
    } catch (error) {
      this.logger.error('buildOrderDetailWithToppings', error);
      throw error;
    }
  }

  private collectToppingIds(detailData: OrderDetailsDto): string[] {
    const ids = new Set<string>();
    for (const unit of detailData.toppingsPerUnit ?? []) {
      for (const id of unit) ids.add(id);
    }
    for (const selection of detailData.promotionSelections ?? []) {
      for (const unit of selection.toppingsPerUnit ?? []) {
        for (const id of unit) ids.add(id);
      }
    }
    return [...ids];
  }

  private collectSelectedProductIds(detailData: OrderDetailsDto): string[] {
    const ids = new Set<string>();
    for (const selection of detailData.promotionSelections ?? []) {
      for (const id of selection.selectedProductIds ?? []) ids.add(id);
    }
    return [...ids];
  }

  private async loadToppingsById(
    qr: QueryRunner,
    toppingIds: string[],
  ): Promise<Map<string, Ingredient>> {
    if (!toppingIds.length) return new Map();
    const toppings = await qr.manager.find(Ingredient, {
      where: { id: In(toppingIds), isActive: true },
      relations: ['toppingsGroups'],
    });
    return new Map(toppings.map((topping) => [topping.id, topping]));
  }

  private async loadProductsById(
    qr: QueryRunner,
    productIds: string[],
  ): Promise<Map<string, Product>> {
    if (!productIds.length) return new Map();
    const products = await qr.manager.find(Product, {
      where: { id: In(productIds), isActive: true },
    });
    return new Map(products.map((product) => [product.id, product]));
  }

  private async loadToppingConfigsByProduct(
    qr: QueryRunner,
    productIds: string[],
  ): Promise<Map<string, ProductAvailableToppingGroup>> {
    const uniqueIds = [...new Set(productIds.filter(Boolean))];
    if (!uniqueIds.length) return new Map();
    const configs = await qr.manager.find(ProductAvailableToppingGroup, {
      where: { productId: In(uniqueIds) },
      relations: ['unitOfMeasure', 'toppingGroup'],
    });
    return new Map(
      configs.map((config) => [
        `${config.productId}:${config.toppingGroup.id}`,
        config,
      ]),
    );
  }

  async adaptResponse(order: Order): Promise<OrderSummaryResponseDto> {
    const productLines: ProductLineDto[] = [];

    for (const detail of order.orderDetails.filter((d) => d.isActive)) {
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
