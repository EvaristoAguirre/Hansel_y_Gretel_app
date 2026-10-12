import {
  Injectable,
  OnApplicationBootstrap,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';
import { randomUUID } from 'crypto';
import { constants as fsConstants, promises as fsPromises } from 'fs';
import * as path from 'path';
import { LoggerService } from 'src/Monitoring/monitoring-logger.service';
import { DataSource, QueryRunner } from 'typeorm';
import { Order } from '../entities/order.entity';
import {
  ARCHIVE_DEFAULTS,
  ArchiveSettings,
  archiveBackupStamp,
  isControlColumn,
  missingArchiveColumns,
  resolveArchiveSettings,
} from './archive.config';
import {
  ArchivedOrderSnapshot,
  ArchiveSourceOrder,
  buildArchiveInserts,
} from './archive.mapper';
import { ArchiveOrderErrorReason } from '../entities/archive-order-error.entity';
import {
  ArchiveRunStatus,
  ArchiveRunTrigger,
} from '../entities/archive-run.entity';

type ArchiveOneResult =
  | { kind: 'archived'; snapshot: ArchivedOrderSnapshot }
  | { kind: 'repaired' }
  | { kind: 'skipped' }
  | { kind: 'ignored' }
  | { kind: 'fatal'; message: string };

@Injectable()
export class ArchiveService
  implements OnModuleInit, OnApplicationBootstrap, OnModuleDestroy
{
  private readonly settings: ArchiveSettings;
  private startupTimer: NodeJS.Timeout | null = null;

  constructor(
    private readonly dataSource: DataSource,
    configService: ConfigService,
    private readonly monitoringLogger: LoggerService,
    private readonly schedulerRegistry: SchedulerRegistry,
  ) {
    this.settings = resolveArchiveSettings((key) =>
      configService.get<string>(key),
    );
  }

  onModuleInit() {
    for (const [key, value] of Object.entries(this.settings.rejected)) {
      if (value) {
        this.monitoringLogger.error(
          `[ARCHIVE] ${key} inválido (${value}); se usa el default`,
        );
      }
    }

    const job = CronJob.from({
      cronTime: this.settings.cron,
      onTick: () => {
        void this.run('cron');
      },
      start: false,
      timeZone: this.settings.timeZone,
    });
    this.schedulerRegistry.addCronJob('archiveOrders', job);
    job.start();
    this.monitoringLogger.log(
      `[ARCHIVE] cron=${this.settings.cron} timezone=${this.settings.timeZone} retentionDays=${this.settings.retentionDays}`,
    );
  }

  onApplicationBootstrap() {
    this.startupTimer = setTimeout(() => {
      void this.run('startup');
    }, this.settings.startupDelayMs);
    this.startupTimer.unref?.();
  }

  onModuleDestroy() {
    if (this.startupTimer) {
      clearTimeout(this.startupTimer);
      this.startupTimer = null;
    }
    try {
      this.schedulerRegistry.getCronJob('archiveOrders').stop();
    } catch {
      // El job no llegó a registrarse.
    }
  }

  async run(trigger: ArchiveRunTrigger): Promise<void> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    let locked = false;
    let runId: string | null = null;
    let closed = false;

    try {
      const lockRows = await queryRunner.query(
        `SELECT pg_try_advisory_lock($1) AS locked`,
        [ARCHIVE_DEFAULTS.advisoryLockKey],
      );
      locked = asBool(lockRows?.[0]?.locked);
      if (!locked) {
        this.monitoringLogger.log(
          `[ARCHIVE] trigger=${trigger} ya hay una corrida en curso`,
        );
        return;
      }

      const columnRows = await queryRunner.query(
        `
          SELECT table_name, column_name
          FROM information_schema.columns
          WHERE table_schema = 'public'
            AND table_name IN (
              'archived_orders',
              'archived_order_details',
              'archived_order_payments',
              'archive_runs',
              'archive_order_errors'
            )
        `,
      );
      const missing = missingArchiveColumns(columnRows ?? []);
      if (missing.length > 0) {
        const list = missing.join(', ');
        this.monitoringLogger.error(
          `[ARCHIVE] trigger=${trigger} status=failed columnas ausentes: ${list}`,
        );
        const controlMissing = missing.filter(isControlColumn);
        if (controlMissing.length === 0) {
          await this.insertClosedRun(
            queryRunner,
            trigger,
            'failed',
            `Columnas ausentes: ${list}`.slice(0, 500),
          );
        }
        return;
      }

      await queryRunner.query(
        `
          UPDATE "archive_runs"
          SET status = 'interrupted',
              "finishedAt" = now(),
              "errorSummary" = 'Corrida interrumpida: el proceso no cerró la fila'
          WHERE status = 'running'
            AND "startedAt" < now() - ($1::int * interval '1 minute')
        `,
        [ARCHIVE_DEFAULTS.staleRunMinutes],
      );

      runId = randomUUID();
      await queryRunner.query(
        `
          INSERT INTO "archive_runs" (
            "id", "startedAt", "trigger", "status",
            "archivedCount", "skippedCount", "repairedCount"
          ) VALUES ($1, now(), $2, 'running', 0, 0, 0)
        `,
        [runId, trigger],
      );

      const cutoffRows = await queryRunner.query(
        `
          SELECT (
            (date_trunc('day', now() AT TIME ZONE $1) AT TIME ZONE $1)
            - ($2::int * interval '1 day')
          ) AS cutoff
        `,
        [this.settings.timeZone, this.settings.retentionDays],
      );
      const cutoff = cutoffRows[0].cutoff as Date;
      const candidates = await queryRunner.query(
        `
          SELECT id
          FROM "orders"
          WHERE state IN ('closed', 'cancelled')
            AND date < $1
          ORDER BY date ASC, id ASC
        `,
        [cutoff],
      );

      let archived = 0;
      let skipped = 0;
      let repaired = 0;
      let fatal: string | null = null;
      const snapshots: ArchivedOrderSnapshot[] = [];

      for (const candidate of candidates) {
        const result = await this.archiveOne(
          queryRunner,
          runId,
          candidate.id,
          cutoff,
        );
        if (result.kind === 'archived') {
          archived += 1;
          snapshots.push(result.snapshot);
        } else if (result.kind === 'repaired') {
          repaired += 1;
        } else if (result.kind === 'skipped') {
          skipped += 1;
        } else if (result.kind === 'fatal') {
          fatal = result.message;
          break;
        }
      }

      const status = resolveStatus(fatal, archived, repaired, skipped);
      const errorSummary = buildErrorSummary(fatal, skipped);
      await this.finishRun(
        queryRunner,
        runId,
        status,
        archived,
        skipped,
        repaired,
        errorSummary,
      );
      closed = true;
      this.monitoringLogger.log(
        `[ARCHIVE] trigger=${trigger} status=${status} archived=${archived} skipped=${skipped} repaired=${repaired}`,
      );

      if (snapshots.length > 0) {
        try {
          await this.createBackupFile(snapshots);
        } catch (backupError) {
          this.monitoringLogger.error(
            `[ARCHIVE] trigger=${trigger} backup falló: ${errorMessage(backupError)}. La base ya quedó archivada.`,
          );
        }
      }
    } catch (error) {
      const message = errorMessage(error);
      this.monitoringLogger.error(
        `[ARCHIVE] trigger=${trigger} status=failed message=${message}`,
      );
      if (runId && !closed) {
        try {
          await this.finishRun(
            queryRunner,
            runId,
            'failed',
            0,
            0,
            0,
            message.slice(0, 500),
          );
        } catch (finishError) {
          this.monitoringLogger.error(
            `[ARCHIVE] trigger=${trigger} no se pudo cerrar la corrida: ${errorMessage(finishError)}`,
          );
        }
      }
    } finally {
      if (locked) {
        try {
          await queryRunner.query(`SELECT pg_advisory_unlock($1)`, [
            ARCHIVE_DEFAULTS.advisoryLockKey,
          ]);
        } catch (unlockError) {
          this.monitoringLogger.error(
            `[ARCHIVE] no se pudo soltar el lock: ${errorMessage(unlockError)}`,
          );
        }
      }
      await queryRunner.release();
    }
  }

  private async archiveOne(
    queryRunner: QueryRunner,
    runId: string,
    orderId: string,
    cutoff: Date,
  ): Promise<ArchiveOneResult> {
    const maxAttempts = 3;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const outcome = await this.archiveOneOnce(queryRunner, orderId, cutoff);
        if (outcome.kind === 'null_product') {
          const message = `Ítem sin producto: ${outcome.detailIds.join(', ')}`;
          await this.recordOrderError(
            queryRunner,
            runId,
            orderId,
            'NULL_PRODUCT',
            null,
            message,
          );
          this.logOrderError(orderId, 'NULL_PRODUCT', null, message);
          return { kind: 'skipped' };
        }
        if (outcome.kind === 'conflict') {
          const message =
            'La orden ya está en archived_orders con distinta cantidad de ítems o pagos';
          await this.recordOrderError(
            queryRunner,
            runId,
            orderId,
            'CONFLICT',
            null,
            message,
          );
          this.logOrderError(orderId, 'CONFLICT', null, message);
          return { kind: 'skipped' };
        }
        if (outcome.kind === 'count_mismatch') {
          const message =
            'La cantidad archivada de ítems o pagos no coincide con la orden viva';
          await this.recordOrderError(
            queryRunner,
            runId,
            orderId,
            'OTHER',
            null,
            message,
          );
          this.logOrderError(orderId, 'OTHER', null, message);
          return { kind: 'skipped' };
        }
        if (outcome.kind === 'ineligible') {
          this.monitoringLogger.log(
            `[ARCHIVE] orderId=${orderId} ya no cumple el criterio`,
          );
          return { kind: 'ignored' };
        }
        return outcome;
      } catch (error) {
        await this.rollbackQuiet(queryRunner);
        const code = pgCodeOf(error);
        const message = errorMessage(error);
        if (isSchemaError(code)) {
          this.monitoringLogger.error(
            `[ARCHIVE] orderId=${orderId} reason=OTHER pgCode=${code ?? ''} message=${message}`,
          );
          return { kind: 'fatal', message };
        }
        if (isRetryable(error) && attempt < maxAttempts) {
          this.monitoringLogger.warn(
            `[ARCHIVE] orderId=${orderId} reintento ${attempt} pgCode=${code ?? ''} message=${message}`,
          );
          continue;
        }
        const reason: ArchiveOrderErrorReason = isRetryable(error)
          ? 'CONNECTION'
          : classifyPgCode(code);
        await this.recordOrderError(
          queryRunner,
          runId,
          orderId,
          reason,
          code,
          message,
        );
        this.logOrderError(orderId, reason, code, message);
        return { kind: 'skipped' };
      }
    }
    return { kind: 'skipped' };
  }

  private async archiveOneOnce(
    queryRunner: QueryRunner,
    orderId: string,
    cutoff: Date,
  ): Promise<
    | { kind: 'archived'; snapshot: ArchivedOrderSnapshot }
    | { kind: 'repaired' }
    | { kind: 'ignored' }
    | { kind: 'ineligible' }
    | { kind: 'null_product'; detailIds: string[] }
    | { kind: 'conflict' }
    | { kind: 'count_mismatch' }
  > {
    await queryRunner.startTransaction();
    const locked = await queryRunner.query(
      `
        SELECT
          id,
          (state IN ('closed', 'cancelled') AND date < $2) AS eligible
        FROM "orders"
        WHERE id = $1
        FOR UPDATE
      `,
      [orderId, cutoff],
    );
    if (!locked.length) {
      await queryRunner.rollbackTransaction();
      return { kind: 'ignored' };
    }
    if (!asBool(locked[0].eligible)) {
      await queryRunner.rollbackTransaction();
      return { kind: 'ineligible' };
    }

    const existing = await queryRunner.query(
      `SELECT id FROM "archived_orders" WHERE id = $1`,
      [orderId],
    );
    if (existing.length) {
      const counts = await this.countSides(queryRunner, orderId);
      if (countsMatch(counts)) {
        await this.deleteLiveOrder(queryRunner, orderId);
        await queryRunner.commitTransaction();
        return { kind: 'repaired' };
      }
      await queryRunner.rollbackTransaction();
      return { kind: 'conflict' };
    }

    const order = await queryRunner.manager.findOne(Order, {
      where: { id: orderId },
      relations: {
        orderDetails: {
          product: { categories: true },
          orderDetailToppings: { topping: true },
          promotionSelections: { selectedProduct: true, slot: true },
        },
        table: { room: true },
        dailyCash: true,
        payments: true,
      },
    });
    if (!order) {
      await queryRunner.rollbackTransaction();
      return { kind: 'ignored' };
    }

    const plan = buildArchiveInserts(order as ArchiveSourceOrder, new Date());
    if (plan.nullProductDetailIds.length > 0) {
      await queryRunner.rollbackTransaction();
      return { kind: 'null_product', detailIds: plan.nullProductDetailIds };
    }
    for (const warning of plan.warnings) {
      this.monitoringLogger.warn(warning);
    }

    await queryRunner.query(
      `
        INSERT INTO "archived_orders" (
          "id", "date", "state", "total", "tip",
          "discountPercent", "discountAmount", "numberCustomers", "comment",
          "commandNumber", "methodOfPayment", "tableId", "dailyCashId",
          "createdAt", "updatedAt", "closedAt",
          "tableName", "roomName", "dailyCashDate", "archivedAt", "snapshotSource"
        ) VALUES (
          $1, $2, $3, $4, $5,
          $6, $7, $8, $9,
          $10, $11, $12, $13,
          $14, $15, $16,
          $17, $18, $19, $20, $21
        )
      `,
      plan.headerParams,
    );
    for (const detailParams of plan.detailParams) {
      await queryRunner.query(
        `
          INSERT INTO "archived_order_details" (
            "id", "quantity", "unitaryPrice", "toppingsExtraCost", "subtotal",
            "productId", "commandNumber", "isActive", "toppings", "promotionSelections",
            "productName", "productCode", "categoryNames", "commentOfProduct",
            "snapshotSource", "orderId"
          ) VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9::json, $10::json,
            $11, $12, $13::json, $14,
            $15, $16
          )
        `,
        detailParams,
      );
    }
    for (const paymentParams of plan.paymentParams) {
      await queryRunner.query(
        `
          INSERT INTO "archived_order_payments" (
            "id", "amount", "methodOfPayment", "createdAt", "orderId"
          ) VALUES ($1, $2, $3, $4, $5)
        `,
        paymentParams,
      );
    }

    const counts = await this.countSides(queryRunner, orderId);
    if (!countsMatch(counts)) {
      await queryRunner.rollbackTransaction();
      return { kind: 'count_mismatch' };
    }
    await this.deleteLiveOrder(queryRunner, orderId);
    await queryRunner.commitTransaction();
    return { kind: 'archived', snapshot: plan.snapshot };
  }

  private async countSides(queryRunner: QueryRunner, orderId: string) {
    const rows = await queryRunner.query(
      `
        SELECT
          (SELECT COUNT(*)::int FROM "order_details" WHERE "orderId" = $1) AS "liveDetails",
          (SELECT COUNT(*)::int FROM "archived_order_details" WHERE "orderId" = $1) AS "archDetails",
          (SELECT COUNT(*)::int FROM "order_payments" WHERE "orderId" = $1) AS "livePayments",
          (SELECT COUNT(*)::int FROM "archived_order_payments" WHERE "orderId" = $1) AS "archPayments"
      `,
      [orderId],
    );
    return {
      liveDetails: Number(rows[0].liveDetails),
      archDetails: Number(rows[0].archDetails),
      livePayments: Number(rows[0].livePayments),
      archPayments: Number(rows[0].archPayments),
    };
  }

  private async deleteLiveOrder(queryRunner: QueryRunner, orderId: string) {
    await queryRunner.query(
      `
        DELETE FROM "order_detail_toppings"
        WHERE "orderDetailsId" IN (
          SELECT id FROM "order_details" WHERE "orderId" = $1
        )
      `,
      [orderId],
    );
    await queryRunner.query(
      `
        DELETE FROM "order_promotion_selections"
        WHERE "orderDetailId" IN (
          SELECT id FROM "order_details" WHERE "orderId" = $1
        )
      `,
      [orderId],
    );
    await queryRunner.query(
      `DELETE FROM "order_payments" WHERE "orderId" = $1`,
      [orderId],
    );
    await queryRunner.query(
      `DELETE FROM "order_details" WHERE "orderId" = $1`,
      [orderId],
    );
    await queryRunner.query(`DELETE FROM "orders" WHERE id = $1`, [orderId]);
  }

  private async insertClosedRun(
    queryRunner: QueryRunner,
    trigger: ArchiveRunTrigger,
    status: ArchiveRunStatus,
    errorSummary: string,
  ) {
    await queryRunner.query(
      `
        INSERT INTO "archive_runs" (
          "id", "startedAt", "finishedAt", "trigger", "status",
          "archivedCount", "skippedCount", "repairedCount", "errorSummary"
        ) VALUES ($1, now(), now(), $2, $3, 0, 0, 0, $4)
      `,
      [randomUUID(), trigger, status, errorSummary],
    );
  }

  private async finishRun(
    queryRunner: QueryRunner,
    runId: string,
    status: ArchiveRunStatus,
    archived: number,
    skipped: number,
    repaired: number,
    errorSummary: string | null,
  ) {
    await queryRunner.query(
      `
        UPDATE "archive_runs"
        SET "finishedAt" = now(),
            status = $2,
            "archivedCount" = $3,
            "skippedCount" = $4,
            "repairedCount" = $5,
            "errorSummary" = $6
        WHERE id = $1
      `,
      [runId, status, archived, skipped, repaired, errorSummary],
    );
  }

  private async recordOrderError(
    queryRunner: QueryRunner,
    runId: string,
    orderId: string,
    reason: ArchiveOrderErrorReason,
    pgCode: string | null,
    message: string,
  ) {
    try {
      await queryRunner.query(
        `
          INSERT INTO "archive_order_errors" (
            "id", "runId", "orderId", "attemptedAt", "reason", "pgCode", "message"
          ) VALUES ($1, $2, $3, now(), $4, $5, $6)
        `,
        [randomUUID(), runId, orderId, reason, pgCode, message.slice(0, 2000)],
      );
    } catch (error) {
      this.monitoringLogger.error(
        `[ARCHIVE] orderId=${orderId} no se pudo guardar el error: ${errorMessage(error)}`,
      );
    }
  }

  private logOrderError(
    orderId: string,
    reason: string,
    pgCode: string | null,
    message: string,
  ) {
    this.monitoringLogger.error(
      `[ARCHIVE] orderId=${orderId} reason=${reason} pgCode=${pgCode ?? ''} message=${message}`,
    );
  }

  private async rollbackQuiet(queryRunner: QueryRunner) {
    if (queryRunner.isTransactionActive) {
      await queryRunner.rollbackTransaction();
    }
  }

  private async createBackupFile(
    orders: ArchivedOrderSnapshot[],
  ): Promise<void> {
    const backupDir = path.join(process.cwd(), 'backups', 'archived-orders');
    await fsPromises.mkdir(backupDir, { recursive: true });
    await fsPromises.access(backupDir, fsConstants.W_OK);

    const stamp = archiveBackupStamp(new Date(), this.settings.timeZone);
    const filePath = path.join(backupDir, `archived-orders-${stamp}.json`);
    const backupData = {
      archivedAt: new Date().toISOString(),
      totalArchived: orders.length,
      orders: orders.map((order) => ({
        ...order,
        paymentSummary: buildPaymentSummary(order),
      })),
    };
    await fsPromises.writeFile(
      filePath,
      JSON.stringify(backupData, null, 2),
      'utf-8',
    );
    this.monitoringLogger.log(`[ARCHIVE] backup guardado en ${filePath}`);
  }
}

function resolveStatus(
  fatal: string | null,
  archived: number,
  repaired: number,
  skipped: number,
): ArchiveRunStatus {
  if (fatal && archived === 0 && repaired === 0) return 'failed';
  if (fatal || skipped > 0) return 'partial';
  return 'success';
}

function buildErrorSummary(
  fatal: string | null,
  skipped: number,
): string | null {
  if (!fatal && skipped === 0) return null;
  const parts: string[] = [];
  if (fatal) parts.push(fatal);
  if (skipped > 0) parts.push(`omitidas=${skipped}`);
  return parts.join('. ').slice(0, 500);
}

function countsMatch(counts: {
  liveDetails: number;
  archDetails: number;
  livePayments: number;
  archPayments: number;
}): boolean {
  return (
    counts.liveDetails === counts.archDetails &&
    counts.livePayments === counts.archPayments
  );
}

function asBool(value: unknown): boolean {
  return value === true || value === 't' || value === 'true';
}

function pgCodeOf(error: unknown): string | null {
  const candidate = error as {
    code?: string;
    driverError?: { code?: string };
  };
  return candidate?.code ?? candidate?.driverError?.code ?? null;
}

function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return String(error);
}

function isSchemaError(code: string | null): boolean {
  return code === '42703' || code === '42P01';
}

function isRetryable(error: unknown): boolean {
  const code = pgCodeOf(error);
  if (code === '40001' || code === '40P01' || code === 'ECONNRESET')
    return true;
  return errorMessage(error).includes('ECONNRESET');
}

function classifyPgCode(code: string | null): ArchiveOrderErrorReason {
  if (code === '23503') return 'FK';
  if (code === '22P02') return 'ENUM';
  if (code === '40001' || code === '40P01' || code === 'ECONNRESET') {
    return 'CONNECTION';
  }
  return 'OTHER';
}

function buildPaymentSummary(order: ArchivedOrderSnapshot) {
  const payments = order.payments ?? [];
  const byMethod = payments.reduce<Record<string, number>>((acc, payment) => {
    acc[payment.methodOfPayment] =
      (acc[payment.methodOfPayment] || 0) + Number(payment.amount);
    return acc;
  }, {});
  const totalPaid = Object.values(byMethod).reduce(
    (sum, amount) => sum + amount,
    0,
  );
  return {
    totalPaid: totalPaid.toFixed(2),
    methodCount: payments.length,
    methods: Object.entries(byMethod).map(([method, amount]) => ({
      method,
      amount: amount.toFixed(2),
    })),
    primaryMethod: payments.length === 1 ? payments[0].methodOfPayment : null,
    discountPercent: Number(order.discountPercent ?? 0),
    discountAmount: Number(order.discountAmount ?? 0),
  };
}
