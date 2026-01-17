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
import { OrderSummaryResponseDto } from 'src/Order/dtos/orderSummaryResponse.dto';
import { ProductLineDto, ToppingSummaryDto } from 'src/DTOs/productSummary.dto';
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
    @InjectRepository(Table)
    private readonly tableRepository: Repository<Table>,
    @InjectRepository(OrderPayment)
    private readonly orderPaymentRepository: Repository<OrderPayment>,
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
      this.logger.error('getOrdersForOpenOrPendingTables', error);
      throw error;
    }
  }

  async closeOrder(
    id: string,
    closeOrderDto: CloseOrderDto,
    openDailyCash: DailyCash,
  ): Promise<OrderSummaryResponseDto> {
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
        relations: [
          'orderDetails',
          'table',
          'orderDetails.product',
          'payments',
        ],
      });
      const responseAdapted = await this.adaptResponse(updatedOrder);
      return responseAdapted;
    } catch (error) {
      this.logger.error('closeOrder', error);
      throw error;
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
  ): Promise<{
    detail: OrderDetails;
    toppingDetails: OrderDetailToppings[];
    subtotal: number;
  }> {
    try {
      const quantity = detailData.quantity;

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

      if (product.allowsToppings && detailData.toppingsPerUnit?.length) {
        if (detailData.toppingsPerUnit.length !== quantity) {
          throw new BadRequestException(
            `La cantidad de unidades (${quantity}) no coincide con el número de arreglos de toppings (${detailData.toppingsPerUnit.length})`,
          );
        }

        for (let unitIndex = 0; unitIndex < quantity; unitIndex++) {
          const toppingsForUnit = detailData.toppingsPerUnit[unitIndex];
          this.logger.debug(
            `[buildOrderDetailWithToppings] Procesando unidad ${unitIndex}, toppings: ${JSON.stringify(toppingsForUnit)}`,
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

            this.logger.debug(
              `[buildOrderDetailWithToppings] Topping creado - Nombre: ${topping.name}, Unidad: ${unitIndex}, Costo extra: ${config.settings?.extraCost || 0}`,
            );
            toppingDetails.push(td);
          }
        }
      }

      // Procesar toppings de productos dentro de slots (promotionSelections)
      if (
        detailData.promotionSelections &&
        detailData.promotionSelections.length > 0
      ) {
        this.logger.log(
          `[buildOrderDetailWithToppings] Procesando toppings de productos dentro de slots`,
        );

        // Iterar sobre cada unidad del producto principal (la promoción)
        for (let unitIndex = 0; unitIndex < quantity; unitIndex++) {
          // Para cada selección de slot (cada selección es un producto individual con sus toppings)
          for (const selection of detailData.promotionSelections) {
            // Cada selección tiene 1 producto con sus toppings en toppingsPerUnit[0]
            // Validar que tenga toppings antes de procesar
            if (
              !selection.toppingsPerUnit ||
              selection.toppingsPerUnit.length === 0
            ) {
              continue;
            }

            // Iterar sobre cada producto en la selección
            // En la estructura del frontend, cada selección tiene 1 producto
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

              // Obtener el producto seleccionado para obtener su configuración de toppings
              const selectedProduct = await qr.manager.findOne(Product, {
                where: { id: selectedProductId, isActive: true },
              });

              if (!selectedProduct) {
                this.logger.warn(
                  `[buildOrderDetailWithToppings] Producto seleccionado ${selectedProductId} no encontrado`,
                );
                continue;
              }

              // Procesar cada topping
              for (const toppingId of toppingsForThisProduct) {
                const topping = await qr.manager.findOne(Ingredient, {
                  where: { id: toppingId, isActive: true },
                  relations: ['toppingsGroups'],
                });

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

                // Obtener la configuración de toppings del PRODUCTO SELECCIONADO (no de la promoción)
                const config = await qr.manager.findOne(
                  ProductAvailableToppingGroup,
                  {
                    where: {
                      product: { id: selectedProduct.id },
                      toppingGroup: { id: toppingGroup.id },
                    },
                    relations: ['unitOfMeasure'],
                  },
                );

                if (!config) {
                  this.logger.warn(
                    `[buildOrderDetailWithToppings] El producto ${selectedProduct.name} no tiene configuración para el grupo de topping ${toppingGroup.name}`,
                  );
                  continue;
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

                toppingDetails.push(td);
              }
            }
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
    } catch (error) {
      this.logger.error('buildOrderDetailWithToppings', error);
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
}
