import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CreateDailyCashDto } from '../DTOs/create-daily-cash.dto';
import { UpdateDailyCashDto } from '../DTOs/update-daily-cash.dto';
import { DailyCashRepository } from './daily-cash.repository';
import { DailyCash } from './daily-cash.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  RegisterExpenseDto,
  RegisterMovementDto,
} from 'src/DTOs/create-expense.dto';
import { CashMovement } from './cash-movement.entity';
import { CloseDailyCash } from 'src/DTOs/close-daily-cash.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, Repository } from 'typeorm';
import { DailyCashState, TableState } from 'src/Enums/states.enum';
import { isUUID } from 'class-validator';
import { PaymentMethod } from 'src/Enums/paymentMethod.enum';
import { DailyCashMovementType } from 'src/Enums/dailyCash.enum';
import { CashMovementDetailsDto } from 'src/DTOs/daily-cash-detail.dto';
import { DailyCashMapper } from './daily-cash-mapper';
import { CashMovementMapper } from './cash-movement-mapper';
import { Order } from 'src/Order/entities/order.entity';
import { LoggerService } from 'src/Monitoring/monitoring-logger.service';
import { TableService } from 'src/Table/table.service';

@Injectable()
export class DailyCashService {
  private readonly logger = new Logger(DailyCashService.name);
  constructor(
    @InjectRepository(DailyCash)
    private readonly dailyCashRepo: Repository<DailyCash>,
    @InjectRepository(CashMovement)
    private readonly cashMovementRepo: Repository<CashMovement>,
    private readonly dailyCashRepository: DailyCashRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly monitoringLogger: LoggerService,
    private readonly tableService: TableService,
    private readonly dataSource: DataSource,
  ) {}

  async openDailyCash(
    createDailyCashDto: CreateDailyCashDto,
  ): Promise<DailyCash> {
    try {
      const today = new Date();
      const existingDailyCash = await this.dailyCashRepo.findOne({
        where: {
          date: today,
        },
      });
      if (existingDailyCash) {
        throw new ConflictException(
          'A daily cash report for today already exists.',
        );
      }

      const dailyCash = this.dailyCashRepo.create(createDailyCashDto);
      dailyCash.date = today;
      dailyCash.state = DailyCashState.OPEN;
      dailyCash.initialCash = createDailyCashDto.initialCash || 0;

      const dailyCashOpened = await this.dailyCashRepo.save(dailyCash);

      // Log crítico: Apertura de caja diaria (operación financiera importante)
      this.monitoringLogger.log({
        action: 'DAILY_CASH_OPENED_SUCCESS',
        dailyCashId: dailyCashOpened.id,
        initialCash: dailyCashOpened.initialCash,
        timestamp: new Date().toISOString(),
      });

      this.eventEmitter.emit('dailyCash.opened', {
        dailyCash: dailyCashOpened,
      });

      return DailyCashMapper.toResponse(dailyCashOpened);
    } catch (error) {
      this.logger.error('openDailyCash', error);
      throw error;
    }
  }

  async getAllDailyCash(page: number, limit: number): Promise<DailyCash[]> {
    if (page <= 0 || limit <= 0) {
      throw new BadRequestException(
        'Page and limit must be positive integers.',
      );
    }
    try {
      const allDailyCash = await this.dailyCashRepository.getAllDailysCash(
        page,
        limit,
      );
      return DailyCashMapper.toMany(allDailyCash || []);
    } catch (error) {
      this.logger.error('getAllDailyCash', error);
      throw error;
    }
  }

  async getDailyCashById(id: string): Promise<DailyCash> {
    if (!id) {
      throw new BadRequestException('Daily cash report ID must be provided.');
    }
    if (!isUUID(id)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
    }
    try {
      const dailyCash = await this.dailyCashRepository.getDailyCashById(id);
      if (!dailyCash) {
        throw new NotFoundException('Daily cash report not found.');
      }
      return DailyCashMapper.toResponse(dailyCash);
    } catch (error) {
      this.logger.error('getDailyCashById', error);
      throw error;
    }
  }

  async updateDailyCash(id: string, updateDailyCashDto: UpdateDailyCashDto) {
    if (!id) {
      throw new BadRequestException('Daily cash report ID must be provided.');
    }
    if (!isUUID(id)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
    }

    try {
      const current = await this.dailyCashRepo.findOne({ where: { id } });
      if (!current) {
        throw new NotFoundException('Daily cash report not found.');
      }

      const patch: { comment?: string; initialCash?: number } = {};
      if (updateDailyCashDto.comment !== undefined) {
        patch.comment = updateDailyCashDto.comment;
      }
      if (updateDailyCashDto.initialCash !== undefined) {
        if (current.state !== DailyCashState.OPEN) {
          throw new ConflictException(
            'No se puede modificar el efectivo inicial de una caja cerrada.',
          );
        }
        patch.initialCash = Number(updateDailyCashDto.initialCash);
      }

      if (Object.keys(patch).length > 0) {
        await this.dailyCashRepo.update(id, patch);
      }

      const updatedDailyCash = await this.getDailyCashById(id);
      if (!updatedDailyCash) {
        throw new NotFoundException('Daily cash report not found.');
      }

      if (Object.keys(patch).length > 0) {
        this.eventEmitter.emit('dailyCash.updated', {
          dailyCash: updatedDailyCash,
        });
      }

      return DailyCashMapper.toResponse(updatedDailyCash);
    } catch (error) {
      this.logger.error('updateDailyCash', error);
      throw error;
    }
  }

  async closeDailyCash(
    id: string,
    closeDailyCashDto: CloseDailyCash,
  ): Promise<DailyCash> {
    if (!id) {
      throw new BadRequestException('Daily cash report ID must be provided.');
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
      const locked = await queryRunner.manager.findOne(DailyCash, {
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });

      if (!locked) {
        throw new NotFoundException('Daily cash report not found.');
      }

      if (locked.state === DailyCashState.CLOSED) {
        throw new ConflictException('Daily cash report is already closed.');
      }

      const tablesWithActiveOrders =
        await this.tableService.getTablesWithActiveOrders();

      if (tablesWithActiveOrders.length > 0) {
        const detail = tablesWithActiveOrders
          .map((t) => {
            const stateLabel =
              t.state === TableState.PENDING_PAYMENT
                ? 'pendiente de cobro'
                : 'con orden abierta';
            return `• [${t.roomName}] ${t.tableName} (${stateLabel})`;
          })
          .join('\n');

        throw new ConflictException(
          `No es posible cerrar la caja. Las siguientes mesas tienen órdenes activas:\n${detail}\n\nCerrá todas las órdenes antes de continuar.`,
        );
      }

      const dailyCash = await queryRunner.manager.findOne(DailyCash, {
        where: { id },
        relations: ['movements', 'orders', 'orders.payments'],
      });

      if (!dailyCash) {
        throw new NotFoundException('Daily cash report not found.');
      }

      dailyCash.state = DailyCashState.CLOSED;
      dailyCash.comment = closeDailyCashDto.comment || '';

      const incomes = (dailyCash.movements || []).filter(
        (mov) => mov.type === DailyCashMovementType.INCOME,
      );
      const expenses = (dailyCash.movements || []).filter(
        (mov) => mov.type === DailyCashMovementType.EXPENSE,
      );

      dailyCash.totalSales = this.sumGrossTotalOrders(dailyCash.orders || []);
      dailyCash.totalDiscounts = this.sumDiscountsOrders(dailyCash.orders || []);
      dailyCash.totalNetSales = dailyCash.totalSales - dailyCash.totalDiscounts;
      dailyCash.totalTips = this.sumTotalTipsOrders(dailyCash.orders || []);
      dailyCash.totalIncomes = this.sumTotal(incomes);
      dailyCash.totalExpenses = this.sumTotal(expenses);

      const orderPayments = this.groupRecordsByPaymentMethod(
        (dailyCash.orders || []).flatMap((order) =>
          (order.payments || []).map((p) => ({
            amount: Number(p.amount),
            methodOfPayment: p.methodOfPayment,
          })),
        ),
      );
      const incomePayments = this.groupRecordsByPaymentMethod(incomes);
      const expensePayments = this.groupRecordsByPaymentMethod(expenses);

      dailyCash.totalCash =
        (orderPayments[PaymentMethod.CASH] || 0) +
        (incomePayments[PaymentMethod.CASH] || 0) -
        (expensePayments[PaymentMethod.CASH] || 0);

      dailyCash.totalCreditCard =
        (orderPayments[PaymentMethod.CREDIT_CARD] || 0) +
        (incomePayments[PaymentMethod.CREDIT_CARD] || 0) -
        (expensePayments[PaymentMethod.CREDIT_CARD] || 0);

      dailyCash.totalDebitCard =
        (orderPayments[PaymentMethod.DEBIT_CARD] || 0) +
        (incomePayments[PaymentMethod.DEBIT_CARD] || 0) -
        (expensePayments[PaymentMethod.DEBIT_CARD] || 0);

      dailyCash.totalTransfer =
        (orderPayments[PaymentMethod.TRANSFER] || 0) +
        (incomePayments[PaymentMethod.TRANSFER] || 0) -
        (expensePayments[PaymentMethod.TRANSFER] || 0);

      dailyCash.totalMercadoPago =
        (orderPayments[PaymentMethod.MERCADOPAGO] || 0) +
        (incomePayments[PaymentMethod.MERCADOPAGO] || 0) -
        (expensePayments[PaymentMethod.MERCADOPAGO] || 0);

      dailyCash.totalBatchClose =
        dailyCash.totalCreditCard +
        dailyCash.totalDebitCard +
        dailyCash.totalTransfer;

      dailyCash.cashDifference =
        Number(closeDailyCashDto.finalCash) -
        Number(dailyCash.initialCash) -
        dailyCash.totalCash;

      dailyCash.finalCash = Number(closeDailyCashDto.finalCash);

      const dailyCashClosed = await queryRunner.manager.save(dailyCash);
      await queryRunner.commitTransaction();

      this.eventEmitter.emit('dailyCash.closed', {
        dailyCash: dailyCashClosed,
      });

      return DailyCashMapper.toResponse(dailyCashClosed);
    } catch (error) {
      if (queryRunner.isTransactionActive) {
        await queryRunner.rollbackTransaction();
      }
      this.logger.error('closeDailyCash', error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async deleteDailyCash(id: number): Promise<void> {
    await this.dailyCashRepo.delete(id);
  }

  async registerExpense(
    expenseData: RegisterExpenseDto,
  ): Promise<CashMovement> {
    const { dailyCashId, movementType, payments, description } = expenseData;

    if (!expenseData.dailyCashId) {
      throw new BadRequestException('Daily cash ID must be provided.');
    }
    if (!isUUID(expenseData.dailyCashId)) {
      throw new BadRequestException(
        'Invalid daily cash ID format. ID must be a valid UUID.',
      );
    }

    try {
      const dailyCash =
        await this.dailyCashRepository.getDailyCashById(dailyCashId);
      if (!dailyCash) {
        throw new NotFoundException('Daily cash report not found.');
      }
      if (dailyCash.state !== 'open') {
        throw new ConflictException(
          'Daily cash report must be open to register expenses.',
        );
      }
      const totalAmount = payments.reduce(
        (sum, payment) => sum + payment.amount,
        0,
      );

      const cashMovement = new CashMovement();
      cashMovement.type = movementType;
      cashMovement.amount = totalAmount;
      cashMovement.description = description || '';
      cashMovement.payments = payments;
      cashMovement.dailyCash = dailyCash;

      if (!dailyCash.movements) {
        dailyCash.movements = [];
      }
      dailyCash.movements.push(cashMovement);

      await this.dailyCashRepo.save(dailyCash);
      await this.cashMovementRepo.save(cashMovement);

      const movement = await this.cashMovementRepo.findOne({
        where: { id: cashMovement.id },
        relations: ['dailyCash'],
      });
      return CashMovementMapper.toResponse(movement);
    } catch (error) {
      this.logger.error('registerExpense', error);
      throw error;
    }
  }

  async registerMovement(
    movementData: RegisterMovementDto,
  ): Promise<CashMovement> {
    const { dailyCashId, payments } = movementData;

    if (!movementData.dailyCashId || !isUUID(movementData.dailyCashId)) {
      throw new BadRequestException('Daily cash ID must be provided.');
    }
    if (!payments || payments.length === 0) {
      throw new BadRequestException(
        'At least one payment method must be provided.',
      );
    }

    try {
      const dailyCash =
        await this.dailyCashRepository.getDailyCashById(dailyCashId);
      if (!dailyCash) {
        throw new NotFoundException('Daily cash report not found.');
      }
      if (dailyCash.state !== 'open') {
        throw new ConflictException(
          'Daily cash report must be open to register expenses.',
        );
      }
      const totalAmount = payments.reduce(
        (sum, payment) => sum + payment.amount,
        0,
      );

      const cashMovement = new CashMovement();
      cashMovement.type = movementData.movementType;
      cashMovement.amount = totalAmount;
      cashMovement.description = movementData.description || '';
      cashMovement.payments = payments;
      cashMovement.dailyCash = dailyCash;

      if (!dailyCash.movements) {
        dailyCash.movements = [];
      }
      dailyCash.movements.push(cashMovement);

      await this.cashMovementRepo.save(cashMovement);
      await this.dailyCashRepo.save(dailyCash);

      const movement = await this.cashMovementRepo.findOne({
        where: { id: cashMovement.id },
        relations: ['dailyCash'],
      });

      return CashMovementMapper.toResponse(movement);
    } catch (error) {
      this.logger.error('registerMovement', error);
      throw error;
    }
  }

  async isAnyDailyCashOpen(): Promise<object> {
    try {
      return await this.dailyCashRepository.isAnyDailyCashOpen();
    } catch (error) {
      this.logger.error('isAnyDailyCashOpen', error);
      throw error;
    }
  }

  async getIncomesByDailyCashId(dailyCashId: string): Promise<CashMovement[]> {
    if (!dailyCashId) {
      throw new BadRequestException('Daily Cash ID must be provided.');
    }
    if (!isUUID(dailyCashId)) {
      throw new BadRequestException(
        'Invalid Daily Cash ID format. ID must be a valid UUID.',
      );
    }
    try {
      const incomes = await this.cashMovementRepo.find({
        where: {
          dailyCash: { id: dailyCashId },
          type: DailyCashMovementType.INCOME,
        },
      });
      return incomes.map(CashMovementMapper.toResponse);
    } catch (error) {
      this.logger.error('getIncomesByDailyCashId', error);
      throw error;
    }
  }

  async getExpensesByDailyCashId(dailyCashId: string): Promise<CashMovement[]> {
    if (!dailyCashId) {
      throw new BadRequestException('Daily Cash ID must be provided.');
    }
    if (!isUUID(dailyCashId)) {
      throw new BadRequestException(
        'Invalid Daily Cash ID format. ID must be a valid UUID.',
      );
    }
    try {
      const expenses = await this.cashMovementRepo.find({
        where: {
          dailyCash: { id: dailyCashId },
          type: DailyCashMovementType.EXPENSE,
        },
      });
      return expenses.map(CashMovementMapper.toResponse);
    } catch (error) {
      this.logger.error('getExpensesByDailyCashId', error);
      throw error;
    }
  }

  async getTodayOpenDailyCash(): Promise<DailyCash | null> {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const dailyCash = await this.dailyCashRepo.findOne({
      where: {
        date: Between(startOfDay, endOfDay),
        state: DailyCashState.OPEN,
      },
      relations: ['movements', 'orders'],
    });
    if (!dailyCash) return null;
    return dailyCash;
  }

  private sumTotal(records: { amount: number }[]): number {
    return records.reduce((acc, r) => acc + this.finiteAmount(r.amount), 0);
  }

  /** Ventas brutas: suma del total de cada orden antes de descuentos. */
  private sumGrossTotalOrders(records: { total: number }[]): number {
    return records.reduce((acc, r) => acc + this.finiteAmount(r.total), 0);
  }

  /** Suma de todos los descuentos aplicados en las órdenes. */
  private sumDiscountsOrders(
    records: { discountAmount?: number }[],
  ): number {
    return records.reduce(
      (acc, r) => acc + this.finiteAmount(r.discountAmount),
      0,
    );
  }

  private groupRecordsByPaymentMethod(
    records: {
      amount?: number;
      methodOfPayment?: PaymentMethod;
      payments?: { amount: number; paymentMethod: PaymentMethod }[];
    }[],
  ): Record<PaymentMethod, number> {
    const totals: Record<PaymentMethod, number> = {
      [PaymentMethod.CASH]: 0,
      [PaymentMethod.CREDIT_CARD]: 0,
      [PaymentMethod.DEBIT_CARD]: 0,
      [PaymentMethod.TRANSFER]: 0,
      [PaymentMethod.MERCADOPAGO]: 0,
    };

    const validMethods = Object.values(PaymentMethod);

    for (const record of records) {
      // Caso 1: método directo
      if (
        record.methodOfPayment &&
        typeof record.amount === 'number' &&
        validMethods.includes(record.methodOfPayment)
      ) {
        totals[record.methodOfPayment] += Number(record.amount);
      }

      // Caso 2: pagos anidados
      if (record.payments && Array.isArray(record.payments)) {
        for (const p of record.payments) {
          if (
            p.paymentMethod &&
            typeof p.amount === 'number' &&
            validMethods.includes(p.paymentMethod)
          ) {
            totals[p.paymentMethod] += Number(p.amount);
          }
        }
      }
    }

    return totals;
  }

  async summaryAtMoment(): Promise<object> {
    const openedDailyCash = await this.getTodayOpenDailyCash();
    const cashFormatter = new Intl.NumberFormat('es-AR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
    try {
      if (openedDailyCash && openedDailyCash.state === DailyCashState.OPEN) {
        const incomes = openedDailyCash.movements.filter(
          (mov) => mov.type === DailyCashMovementType.INCOME,
        );
        const expenses = openedDailyCash.movements.filter(
          (mov) => mov.type === DailyCashMovementType.EXPENSE,
        );
        const totalSalesFromOrders = Number(
          this.sumGrossTotalOrders(openedDailyCash.orders),
        );
        const totalIncomes = Number(this.sumTotal(incomes));
        const totalExpenses = Number(this.sumTotal(expenses));

        return {
          incomes: cashFormatter.format(totalIncomes + totalSalesFromOrders),
          expenses: cashFormatter.format(totalExpenses),
        };
      } else {
        return { result: 'No hay resumen disponible' };
      }
    } catch (error) {
      this.logger.error('summaryAtMoment', error);
      throw error;
    }
  }

  async getDailyCashWithOrdersByDate(
    day: number,
    month: number,
    year: number,
  ): Promise<DailyCash | null> {
    const startOfDay = new Date(year, month - 1, day, 0, 0, 0, 0);
    const endOfDay = new Date(year, month - 1, day, 23, 59, 59, 999);

    const dailyCash = await this.dailyCashRepo.findOne({
      where: {
        date: Between(startOfDay, endOfDay),
      },
      relations: ['orders', 'movements', 'orders.payments'],
    });
    if (!dailyCash) throw new NotFoundException('Daily cash not found');
    return DailyCashMapper.toResponse(dailyCash);
  }

  async detailsMovementById(
    cashMovementId: string,
  ): Promise<CashMovementDetailsDto> {
    try {
      const movement = await this.cashMovementRepo.findOne({
        where: { id: cashMovementId },
      });

      if (!movement) {
        throw new NotFoundException(
          `Movimiento con ID ${cashMovementId} no encontrado`,
        );
      }

      const result = {
        type: movement.type,
        amount: this.formatMoney(movement.amount),
        createdAt: movement.createdAt,
        payments: Array.isArray(movement.payments)
          ? movement.payments.map((p) => ({
              amount: this.formatMoney(p.amount),
              paymentMethod: p.paymentMethod,
            }))
          : [],
      };

      return result;
    } catch (error) {
      this.logger.error('detailsMovementById', error);
      throw error;
    }
  }

  private formatMoney(value: number | string | null | undefined): string {
    const numberValue =
      typeof value === 'string' ? Number(value) : (value ?? 0);
    return numberValue.toLocaleString('es-AR', {
      style: 'currency',
      currency: 'ARS',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  }

  private sumTotalTipsOrders(orders: Order[]): number {
    return orders.reduce((tip, order) => tip + this.finiteAmount(order.tip), 0);
  }

  private finiteAmount(value: unknown): number {
    const amount = Number(value);
    return Number.isFinite(amount) ? amount : 0;
  }

  /** SUM que no deja que un numeric NaN anule el total del período. */
  private finiteSum(columnSql: string): string {
    return `COALESCE(SUM(${columnSql}) FILTER (WHERE ${columnSql} IS DISTINCT FROM 'NaN'::numeric), 0)`;
  }

  // ------------------- metricas -----------------------
  async getMonthlySummary(
    month: number,
    year: number,
  ): Promise<{
    income: number;
    expenses: number;
    profit: number;
  }> {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const results = await this.dailyCashRepo.find({
      where: {
        date: Between(startDate, endDate),
        state: DailyCashState.CLOSED,
      },
    });

    const income = results.reduce(
      (acc, dc) => acc + Number(dc.totalSales) + Number(dc.totalIncomes),
      0,
    );
    const expenses = results.reduce(
      (acc, dc) => acc + Number(dc.totalExpenses),
      0,
    );
    const profit = income - expenses;

    return { income, expenses, profit };
  }

  async getAnnualSummary(year: number): Promise<{
    income: number;
    expenses: number;
    profit: number;
  }> {
    const startDate = new Date(`${year}-01-01T00:00:00`);
    const endDate = new Date(`${year}-12-31T23:59:59`);

    const totalSales = await this.sumSalesBetween(startDate, endDate);
    const { incomes: totalIncomes, expenses: totalExpenses } =
      await this.sumMovementsBetween(startDate, endDate);

    const income = totalSales + totalIncomes;
    const profit = income - totalExpenses;

    return {
      income,
      expenses: totalExpenses,
      profit,
    };
  }

  async getAnnualDistribution(
    year: number,
  ): Promise<{ mes: string; income: number; expenses: number }[]> {
    const months = [
      'enero',
      'febrero',
      'marzo',
      'abril',
      'mayo',
      'junio',
      'julio',
      'agosto',
      'septiembre',
      'octubre',
      'noviembre',
      'diciembre',
    ];
    const start = new Date(year, 0, 1, 0, 0, 0, 0);
    const end = new Date(year, 11, 31, 23, 59, 59, 999);
    const sales = await this.salesByCalendarPart(start, end, 'MONTH');
    const movements = await this.movementsByCalendarPart(start, end, 'MONTH');

    return months.map((mes, index) => {
      const bucket = index + 1;
      return {
        mes,
        income:
          (sales.get(bucket) ?? 0) + (movements.incomes.get(bucket) ?? 0),
        expenses: movements.expenses.get(bucket) ?? 0,
      };
    });
  }

  async getDailyMetrics(
    month: number,
    year: number,
  ): Promise<{ day: string; income: number; expenses: number }[]> {
    const daysInMonth = new Date(year, month, 0).getDate();
    const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
    const end = new Date(year, month, 0, 23, 59, 59, 999);
    const sales = await this.salesByCalendarPart(start, end, 'DAY');
    const movements = await this.movementsByCalendarPart(start, end, 'DAY');

    const results = [];
    for (let day = 1; day <= daysInMonth; day++) {
      results.push({
        day: String(day).padStart(2, '0'),
        income: (sales.get(day) ?? 0) + (movements.incomes.get(day) ?? 0),
        expenses: movements.expenses.get(day) ?? 0,
      });
    }

    return results;
  }

  async getDailyProfit(
    month: number,
    year: number,
  ): Promise<{ day: string; profit: number }[]> {
    const metrics = await this.getDailyMetrics(month, year);
    return metrics.map(({ day, income, expenses }) => ({
      day,
      profit: income - expenses,
    }));
  }

  private async sumSalesBetween(start: Date, end: Date): Promise<number> {
    const row = await this.dailyCashRepo
      .createQueryBuilder('cash')
      .select(this.finiteSum('cash."totalSales"'), 'total')
      .where('cash.date BETWEEN :start AND :end', { start, end })
      .getRawOne<{ total: string }>();
    return this.finiteAmount(row?.total);
  }

  private async sumMovementsBetween(
    start: Date,
    end: Date,
  ): Promise<{ incomes: number; expenses: number }> {
    const rows = await this.cashMovementRepo
      .createQueryBuilder('movement')
      .select('movement.type', 'type')
      .addSelect(this.finiteSum('movement.amount'), 'total')
      .where('movement."createdAt" BETWEEN :start AND :end', { start, end })
      .groupBy('movement.type')
      .getRawMany<{ type: string; total: string }>();
    return this.splitMovementTotals(rows);
  }

  private async salesByCalendarPart(
    start: Date,
    end: Date,
    part: 'MONTH' | 'DAY',
  ): Promise<Map<number, number>> {
    const rows = await this.dailyCashRepo
      .createQueryBuilder('cash')
      .select(`EXTRACT(${part} FROM cash.date)`, 'bucket')
      .addSelect(this.finiteSum('cash."totalSales"'), 'total')
      .where('cash.date BETWEEN :start AND :end', { start, end })
      .groupBy('bucket')
      .getRawMany<{ bucket: string; total: string }>();

    const totals = new Map<number, number>();
    for (const row of rows) {
      totals.set(Number(row.bucket), this.finiteAmount(row.total));
    }
    return totals;
  }

  private async movementsByCalendarPart(
    start: Date,
    end: Date,
    part: 'MONTH' | 'DAY',
  ): Promise<{ incomes: Map<number, number>; expenses: Map<number, number> }> {
    const rows = await this.cashMovementRepo
      .createQueryBuilder('movement')
      .select(`EXTRACT(${part} FROM movement."createdAt")`, 'bucket')
      .addSelect('movement.type', 'type')
      .addSelect(this.finiteSum('movement.amount'), 'total')
      .where('movement."createdAt" BETWEEN :start AND :end', { start, end })
      .groupBy('bucket')
      .addGroupBy('movement.type')
      .getRawMany<{ bucket: string; type: string; total: string }>();

    const incomes = new Map<number, number>();
    const expenses = new Map<number, number>();
    for (const row of rows) {
      const bucket = Number(row.bucket);
      const total = this.finiteAmount(row.total);
      if (row.type === DailyCashMovementType.INCOME) {
        incomes.set(bucket, total);
      } else if (row.type === DailyCashMovementType.EXPENSE) {
        expenses.set(bucket, total);
      }
    }
    return { incomes, expenses };
  }

  private splitMovementTotals(
    rows: { type: string; total: string }[],
  ): { incomes: number; expenses: number } {
    let incomes = 0;
    let expenses = 0;
    for (const row of rows) {
      const total = this.finiteAmount(row.total);
      if (row.type === DailyCashMovementType.INCOME) incomes = total;
      else if (row.type === DailyCashMovementType.EXPENSE) expenses = total;
    }
    return { incomes, expenses };
  }
}
