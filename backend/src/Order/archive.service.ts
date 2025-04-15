import { Injectable, Logger } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { Order } from './order.entity';
import { Between, DataSource, In } from 'typeorm';
import { ArchivedOrder } from './archived_order.entity';
import { Cron } from '@nestjs/schedule';
import { OrderState } from 'src/Enums/states.enum';
import { ArchivedOrderDetails } from './archived_order_details.entity';

@Injectable()
export class ArchiveService {
  private readonly logger = new Logger(ArchiveService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly notificationService: NotificationService,
  ) {}

  @Cron('10 21 * * 0')
  async archiveOrders() {
    const maxAttempts = 3;
    const delayBetweenAttempts = 60000;
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        attempts++;

        await this.dataSource.transaction(async (manager) => {
          const ordersToArchive = await manager.find(Order, {
            where: {
              state: In([
                OrderState.CLOSED,
                OrderState.CANCELLED,
                OrderState.PENDING_PAYMENT,
              ]),
              date: Between(
                this.getLastWeekRange().start,
                this.getLastWeekRange().end,
              ),
            },
            relations: ['orderDetails'],
          });

          const archivedOrders = ordersToArchive.map((order) => {
            const archived = new ArchivedOrder();
            archived.id = order.id;
            archived.date = order.date;
            archived.state = order.state;
            archived.total = order.total;
            archived.numberCustomers = order.numberCustomers;
            archived.comment = order.comment;
            archived.commandNumber = order.commandNumber;
            archived.tableId = order.table?.id;

            archived.orderDetails = order.orderDetails?.map((detail) => {
              const archivedDetail = new ArchivedOrderDetails();
              archivedDetail.id = detail.id;
              archivedDetail.quantity = detail.quantity;
              archivedDetail.productId = detail.product?.id;
              archivedDetail.unitaryPrice = detail.unitaryPrice;
              archivedDetail.subtotal = detail.subtotal;
              return archivedDetail;
            });

            return archived;
          });

          await manager.save(ArchivedOrder, archivedOrders);
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

  private getLastWeekRange(): { start: Date; end: Date } {
    const end = new Date();
    end.setDate(end.getDate() - (end.getDay() || 7));
    end.setHours(0, 0, 0, 0);

    const start = new Date(end);
    start.setDate(start.getDate() - 7);

    return { start, end };
  }
}
