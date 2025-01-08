import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { NotificationService } from './notification.service';

@Injectable()
export class ArchiveService {
  private readonly logger = new Logger(ArchiveService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly notificationService: NotificationService,
  ) {}

  private async sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  @Cron('0 0 * * 0') // Ejecutar todos los domingos a medianoche.
  async archiveOrders() {
    const maxAttempts = 3;
    const delayBetweenAttempts = 60000; // 60 segundos entre intentos.
    let attempts = 0;

    while (attempts < maxAttempts) {
      try {
        attempts++;

        await this.dataSource.transaction(async (manager) => {
          // 1. Insertar órdenes en la tabla de archivado.
          await manager.query(`
            INSERT INTO archived_orders (id, date, state, is_active, table_id)
            SELECT id, date, state, is_active, table_id
            FROM orders
            WHERE state = 'COMPLETED' AND date < NOW() - INTERVAL '30 days';
          `);

          // 2. Eliminar órdenes archivadas de la tabla original.
          await manager.query(`
            DELETE FROM orders
            WHERE state = 'COMPLETED' AND date < NOW() - INTERVAL '30 days';
          `);

          this.logger.log('Órdenes archivadas exitosamente.');
        });

        // Si todo fue exitoso, salimos del bucle.
        break;
      } catch (error) {
        this.logger.warn(`Intento ${attempts} fallido: ${error.message}`);

        if (attempts === maxAttempts) {
          this.logger.error(
            'El proceso de archivado falló después de 3 intentos.',
          );

          // Notificar el error.
          await this.notificationService.notifyError(
            'Error en el proceso de archivado',
            `El proceso de archivado falló después de ${maxAttempts} intentos. Error: ${error.message}`,
          );
        } else {
          this.logger.warn(
            `Esperando ${delayBetweenAttempts / 1000} segundos antes del próximo intento.`,
          );
          await this.sleep(delayBetweenAttempts); // Espera antes del próximo intento.
        }
      }
    }
  }
}
