import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Order } from './order.entity';
import { Between, DataSource, In } from 'typeorm';
import { ArchivedOrder } from './archived_order.entity';
import { Cron } from '@nestjs/schedule';
import { OrderState } from 'src/Enums/states.enum';
import { ArchivedOrderDetails } from './archived_order_details.entity';
import * as fs from 'fs';
import * as path from 'path';
import { ArchivedOrderPayment } from './archived_order_payments.entity';

@Injectable()
export class ArchiveService {
  private readonly logger = new Logger(ArchiveService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly notificationService: NotificationService,
  ) {}

  @Cron('10 21 * * 0')
  // @Cron('35 17 * * *') // todos los dias para probarlo ahora
  async archiveOrders() {
    const maxAttempts = 3;
    const delayBetweenAttempts = 60000;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        attempts++;
        console.log(
          `Intento ${attempts} de ${maxAttempts}, archivando órdenes...`,
        );
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
              'table',
              'dailyCash',
              'payments',
            ],
          });

          const archivedOrders = ordersToArchive.map((order) => {
            const archived = new ArchivedOrder();
            archived.id = order.id;
            archived.date = order.date;
            archived.state = order.state;
            archived.total = order.total;
            archived.numberCustomers = order.numberCustomers;
            archived.comment = order.comment;
            archived.tableId = order.table?.id;
            archived.dailyCashId = order.dailyCash?.id;
            archived.commandNumber = (order as any).commandNumber ?? null;

            archived.orderDetails = order.orderDetails?.map((detail) => {
              const archivedDetail = new ArchivedOrderDetails();
              archivedDetail.id = detail.id;
              archivedDetail.quantity = detail.quantity;
              archivedDetail.unitaryPrice = detail.unitaryPrice;
              archivedDetail.subtotal = detail.subtotal;
              archivedDetail.productId = detail.product?.id;
              archivedDetail.commandNumber = detail.commandNumber ?? null;
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
          // -------- nuevo ----------
          const backupData = {
            archivedAt: new Date().toISOString(),
            totalArchived: archivedOrders.length,
            orders: archivedOrders,
          };

          const backupDir = path.join(
            process.cwd(),
            'backups',
            'archived-orders',
          );
          // Crear carpeta si no existe
          if (!fs.existsSync(backupDir)) {
            fs.mkdirSync(backupDir, { recursive: true });
          }

          const fileName = `archived-orders-${new Date().toISOString().slice(0, 10)}.json`;
          const filePath = path.join(backupDir, fileName);
          fs.writeFileSync(
            filePath,
            JSON.stringify(backupData, null, 2),
            'utf-8',
          );

          this.logger.log(
            `Backup de órdenes archivadas guardado en ${filePath}`,
          );
          // ---------------------------------------------------------
          await manager.remove(Order, ordersToArchive);

          this.logger.log(`Archivadas ${archivedOrders.length} órdenes`);
        });

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
