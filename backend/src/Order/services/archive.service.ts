import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Order } from '../entities/order.entity';
import { Between, DataSource, In } from 'typeorm';
import { ArchivedOrder } from '../entities/archived_order.entity';
import { Cron } from '@nestjs/schedule';
import { OrderState } from 'src/Enums/states.enum';
import { ArchivedOrderDetails } from '../entities/archived_order_details.entity';
import * as fs from 'fs';
import * as path from 'path';
import { ArchivedOrderPayment } from '../entities/archived_order_payments.entity';

@Injectable()
export class ArchiveService {
  private readonly logger = new Logger(ArchiveService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly notificationService: NotificationService,
  ) {}

  @Cron('10 21 * * 0') // cada domingo a las 21:10
  // @Cron('*/5 * * * *') // Ejecutar cada 5 minutos (solo para pruebas)
  async archiveOrders() {
    const maxAttempts = 3;
    const delayBetweenAttempts = 60000;
    let attempts = 0;

    while (attempts < maxAttempts) {
      let archivedOrders: ArchivedOrder[] = [];

      try {
        attempts++;
        console.log(
          `Intento ${attempts} de ${maxAttempts}, archivando órdenes...`,
        );

        // Transacción de base de datos
        await this.dataSource.transaction(async (manager) => {
          const { start, end } = this.getPreviousWeekRange();

          const ordersToArchive = await manager.find(Order, {
            where: {
              state: In([
                OrderState.CLOSED,
                OrderState.CANCELLED,
                OrderState.PENDING_PAYMENT,
              ]),
              date: Between(start, end),
            },
            relations: [
              'orderDetails',
              'orderDetails.product',
              'orderDetails.orderDetailToppings',
              'orderDetails.orderDetailToppings.topping',
              'orderDetails.orderDetailToppings.unitOfMeasure',
              'orderDetails.promotionSelections',
              'orderDetails.promotionSelections.selectedProduct',
              'orderDetails.promotionSelections.slot',
              'table',
              'dailyCash',
              'payments',
            ],
          });

          archivedOrders = ordersToArchive.map((order) => {
            const archived = new ArchivedOrder();
            archived.id = order.id;
            archived.date = order.date;
            archived.state = order.state;
            archived.total = order.total;
            archived.tip = order.tip;
            archived.numberCustomers = order.numberCustomers;
            archived.comment = order.comment;
            archived.tableId = order.table?.id ?? null;
            archived.dailyCashId = order.dailyCash?.id ?? null;
            archived.commandNumber = (order as any).commandNumber ?? null;
            archived.createdAt = order.createdAt;
            archived.updatedAt = order.updatedAt;
            archived.closedAt = order.closedAt;

            archived.orderDetails = order.orderDetails?.map((detail) => {
              const archivedDetail = new ArchivedOrderDetails();
              archivedDetail.id = detail.id;
              archivedDetail.quantity = detail.quantity;
              archivedDetail.unitaryPrice = detail.unitaryPrice;
              archivedDetail.toppingsExtraCost = detail.toppingsExtraCost;
              archivedDetail.subtotal = detail.subtotal;
              archivedDetail.productId = detail.product?.id;
              archivedDetail.commandNumber = detail.commandNumber ?? null;

              // Mapear toppings a JSON
              archivedDetail.toppings =
                detail.orderDetailToppings?.map((topping) => ({
                  toppingId: topping.topping?.id,
                  toppingName: topping.topping?.name,
                  unitOfMeasureName: topping.unitOfMeasureName,
                  unitIndex: topping.unitIndex,
                })) ?? [];

              // Mapear promotion selections a JSON
              archivedDetail.promotionSelections =
                detail.promotionSelections?.map((selection) => ({
                  slotId: selection.slotId,
                  selectedProductId: selection.selectedProductId,
                  selectedProductName: selection.selectedProduct?.name,
                  extraCostApplied: selection.extraCostApplied,
                })) ?? [];

              return archivedDetail;
            });

            archived.payments = (order.payments || []).map((payment) => {
              const archivedPayment = new ArchivedOrderPayment();
              archivedPayment.amount = payment.amount;
              archivedPayment.methodOfPayment = payment.methodOfPayment;
              archivedPayment.createdAt = payment.createdAt;
              return archivedPayment;
            });

            return archived;
          });

          await manager.save(ArchivedOrder, archivedOrders);
          await manager.remove(Order, ordersToArchive);

          this.logger.log(
            `Archivadas ${archivedOrders.length} órdenes en la base de datos`,
          );
        });

        // Backup JSON fuera de la transacción
        if (archivedOrders.length > 0) {
          try {
            await this.createBackupFile(archivedOrders);
          } catch (backupError) {
            this.logger.error(
              `Error al crear backup JSON: ${backupError.message}. Las órdenes se archivaron correctamente en la base de datos.`,
            );
            // No lanzar error, el archivado en BD fue exitoso
          }
        }

        break;
      } catch (error) {
        this.logger.error(`Intento ${attempts} fallido: ${error.message}`);

        if (attempts === maxAttempts) {
          await this.notificationService.notifyError(
            'Error en archivado',
            `Falló después de ${maxAttempts} intentos. Error: ${error.message}`,
          );
        } else {
          await new Promise((resolve) =>
            setTimeout(resolve, delayBetweenAttempts),
          );
        }
      }
    }
  }

  private async createBackupFile(
    archivedOrders: ArchivedOrder[],
  ): Promise<void> {
    const backupData = {
      archivedAt: new Date().toISOString(),
      totalArchived: archivedOrders.length,
      orders: archivedOrders,
    };

    const backupDir = path.join(process.cwd(), 'backups', 'archived-orders');

    // Validar permisos del directorio
    try {
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      // Validar que se puede escribir en el directorio
      fs.accessSync(backupDir, fs.constants.W_OK);
    } catch (error) {
      throw new Error(
        `No se puede escribir en el directorio de backups: ${backupDir}. Error: ${error.message}`,
      );
    }

    const fileName = `archived-orders-${new Date().toISOString().slice(0, 10)}.json`;
    const filePath = path.join(backupDir, fileName);

    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf-8');

    this.logger.log(`Backup de órdenes archivadas guardado en ${filePath}`);
  }

  private getPreviousWeekRange(): { start: Date; end: Date } {
    const now = new Date();
    const end = new Date(now);

    end.setDate(now.getDate() - now.getDay() - 1);
    end.setHours(23, 59, 59, 999);

    const start = new Date(end);
    start.setDate(end.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    return { start, end };
  }

  // private getPreviousWeekRange(): { start: Date; end: Date } {
  //   const now = new Date();
  //   const start = new Date(now);
  //   start.setHours(0, 0, 0, 0);

  //   const end = new Date(now);
  //   end.setHours(23, 59, 59, 999);

  //   return { start, end };
  // }
}
