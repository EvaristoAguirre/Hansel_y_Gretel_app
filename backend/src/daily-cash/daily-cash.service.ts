import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
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
import { Between, Repository } from 'typeorm';
import { DailyCashState } from 'src/Enums/states.enum';
import { isUUID } from 'class-validator';
import { PaymentMethod } from 'src/Enums/paymentMethod.enum';
import { DailyCashMovementType } from 'src/Enums/dailyCash.enum';
import { CashMovementDetailsDto } from 'src/DTOs/daily-cash-detail.dto';
import { DailyCashMapper } from './daily-cash-mapper';
import { CashMovementMapper } from './cash-movement-mapper';
import { Order } from 'src/Order/order.entity';
import { LoggerService } from 'src/Monitoring/monitoring-logger.service';

@Injectable()
export class DailyCashService {
  constructor(
    @InjectRepository(DailyCash)
    private readonly dailyCashRepo: Repository<DailyCash>,
    @InjectRepository(CashMovement)
    private readonly cashMovementRepo: Repository<CashMovement>,
    private readonly dailyCashRepository: DailyCashRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly monitoringLogger: LoggerService,
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
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error openning the daily cash report. Please try again later.',
        error.message,
      );
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
      return DailyCashMapper.toMany(allDailyCash);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }

      throw new InternalServerErrorException(
        'Error updating the order. Please try again later.',
        error.message,
      );
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
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Daily cash not found. Please try again later.',
        error.message,
      );
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
      await this.dailyCashRepo.update(id, updateDailyCashDto);

      const updatedDailyCash = await this.getDailyCashById(id);
      if (!updatedDailyCash) {
        throw new NotFoundException('Daily cash report not found.');
      }

      this.eventEmitter.emit('dailyCash.updated', {
        dailyCash: updatedDailyCash,
      });

      return DailyCashMapper.toResponse(updatedDailyCash);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Daily cash not found. Please try again later.',
        error.message,
      );
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

    try {
      const dailyCash = await this.dailyCashRepository.getDailyCashById(id);

      if (!dailyCash) {
        throw new NotFoundException('Daily cash report not found.');
      }

      if (dailyCash.state === DailyCashState.CLOSED) {
        throw new ConflictException('Daily cash report is already closed.');
      }

      dailyCash.state = DailyCashState.CLOSED;
      dailyCash.comment = closeDailyCashDto.comment || '';

      // --- Separar movimientos por tipo ---
      const incomes = dailyCash.movements.filter(
        (mov) => mov.type === DailyCashMovementType.INCOME,
      );
      const expenses = dailyCash.movements.filter(
        (mov) => mov.type === DailyCashMovementType.EXPENSE,
      );

      // --- Guardar TOTALES de ventas, propinas, ingresos y egresos directos ---
      dailyCash.totalSales = this.sumTotalOrders(dailyCash.orders);
      dailyCash.totalTips = this.sumTotalTipsOrders(dailyCash.orders);
      dailyCash.totalIncomes = this.sumTotal(incomes);
      dailyCash.totalExpenses = this.sumTotal(expenses);

      // --- Agrupación por método de pago ---

      const orderPayments = this.groupRecordsByPaymentMethod(
        dailyCash.orders.flatMap((order) =>
          (order.payments || []).map((p) => ({
            amount: Number(p.amount),
            methodOfPayment: p.methodOfPayment,
          })),
        ),
      );
      const incomePayments = this.groupRecordsByPaymentMethod(incomes);
      const expensePayments = this.groupRecordsByPaymentMethod(expenses);

      // --- Totales netos por método de pago ---
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

      dailyCash.cashDifference =
        Number(closeDailyCashDto.finalCash) -
        Number(dailyCash.initialCash) -
        dailyCash.totalCash;

      dailyCash.finalCash = Number(closeDailyCashDto.finalCash);

      const dailyCashClosed = await this.dailyCashRepo.save(dailyCash);

      this.eventEmitter.emit('dailyCash.closed', {
        dailyCash: dailyCashClosed,
      });

      return DailyCashMapper.toResponse(dailyCashClosed);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error closing the daily cash report. Please try again later.',
        error.message,
      );
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
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Error registering the expense. Please try again later.',
        error.message,
      );
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
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Error registering the expense. Please try again later.',
        error.message,
      );
    }
  }

  async isAnyDailyCashOpen(): Promise<object> {
    try {
      return await this.dailyCashRepository.isAnyDailyCashOpen();
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Error checking if any daily cash is open. Please try again later.',
        error.message,
      );
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
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Error fetching incomes by daily cash ID. Please try again later.',
        error.message,
      );
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
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Error fetching incomes by daily cash ID. Please try again later.',
        error.message,
      );
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
    return records.reduce((acc, r) => acc + Number(r.amount), 0);
  }

  private sumTotalOrders(records: { total: number }[]): number {
    return records.reduce((acc, r) => acc + Number(r.total), 0);
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
          this.sumTotalOrders(openedDailyCash.orders),
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
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'An error occurred while trying to generate the daily cash summary. Please try again later.',
        error.message,
      );
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
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Error al obtener el movimiento de caja',
      );
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
    return orders.reduce((tip, order) => tip + Number(order.tip), 0);
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

    // Total ventas del año
    const cashes = await this.dailyCashRepo.find({
      where: {
        date: Between(startDate, endDate),
      },
      select: ['totalSales'], // solo ventas
    });

    const totalSales = cashes.reduce(
      (acc, cash) => acc + Number(cash.totalSales),
      0,
    );

    // Ingresos del año
    const incomeMovements = await this.cashMovementRepo.find({
      where: {
        type: DailyCashMovementType.INCOME,
        createdAt: Between(startDate, endDate),
      },
    });

    const totalIncomes = incomeMovements.reduce(
      (acc, m) => acc + Number(m.amount),
      0,
    );

    // Egresos del año
    const expenseMovements = await this.cashMovementRepo.find({
      where: {
        type: DailyCashMovementType.EXPENSE,
        createdAt: Between(startDate, endDate),
      },
    });

    const totalExpenses = expenseMovements.reduce(
      (acc, m) => acc + Number(m.amount),
      0,
    );

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

    const results = [];

    for (let month = 0; month < 12; month++) {
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999);

      const cashes = await this.dailyCashRepo.find({
        where: {
          date: Between(start, end),
        },
        select: ['totalSales'],
      });

      const totalSales = cashes.reduce(
        (acc, cash) => acc + Number(cash.totalSales),
        0,
      );

      const incomes = await this.cashMovementRepo.find({
        where: {
          type: DailyCashMovementType.INCOME,
          createdAt: Between(start, end),
        },
      });

      const totalIncomes = incomes.reduce(
        (acc, i) => acc + Number(i.amount),
        0,
      );

      const expenses = await this.cashMovementRepo.find({
        where: {
          type: DailyCashMovementType.EXPENSE,
          createdAt: Between(start, end),
        },
      });

      const totalExpenses = expenses.reduce(
        (acc, e) => acc + Number(e.amount),
        0,
      );

      results.push({
        mes: months[month],
        income: totalSales + totalIncomes,
        expenses: totalExpenses,
      });
    }

    return results;
  }

  async getDailyMetrics(
    month: number,
    year: number,
  ): Promise<{ day: string; income: number; expenses: number }[]> {
    const daysInMonth = new Date(year, month, 0).getDate();
    const results = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const start = new Date(year, month - 1, day, 0, 0, 0, 0);
      const end = new Date(year, month - 1, day, 23, 59, 59, 999);

      const cashes = await this.dailyCashRepo.find({
        where: { date: Between(start, end) },
        select: ['totalSales'],
      });
      const totalSales = cashes.reduce(
        (acc, cash) => acc + Number(cash.totalSales),
        0,
      );

      const incomes = await this.cashMovementRepo.find({
        where: {
          type: DailyCashMovementType.INCOME,
          createdAt: Between(start, end),
        },
      });
      const totalIncomes = incomes.reduce(
        (acc, m) => acc + Number(m.amount),
        0,
      );

      const expenses = await this.cashMovementRepo.find({
        where: {
          type: DailyCashMovementType.EXPENSE,
          createdAt: Between(start, end),
        },
      });
      const totalExpenses = expenses.reduce(
        (acc, m) => acc + Number(m.amount),
        0,
      );

      results.push({
        day: String(day).padStart(2, '0'),
        income: totalSales + totalIncomes,
        expenses: totalExpenses,
      });
    }

    return results;
  }

  async getDailyProfit(
    month: number,
    year: number,
  ): Promise<{ day: string; profit: number }[]> {
    const daysInMonth = new Date(year, month, 0).getDate();
    const results = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const start = new Date(year, month - 1, day, 0, 0, 0, 0);
      const end = new Date(year, month - 1, day, 23, 59, 59, 999);

      const cashes = await this.dailyCashRepo.find({
        where: { date: Between(start, end) },
        select: ['totalSales'],
      });
      const totalSales = cashes.reduce(
        (acc, cash) => acc + Number(cash.totalSales),
        0,
      );

      const incomes = await this.cashMovementRepo.find({
        where: {
          type: DailyCashMovementType.INCOME,
          createdAt: Between(start, end),
        },
      });
      const totalIncomes = incomes.reduce(
        (acc, m) => acc + Number(m.amount),
        0,
      );

      const expenses = await this.cashMovementRepo.find({
        where: {
          type: DailyCashMovementType.EXPENSE,
          createdAt: Between(start, end),
        },
      });
      const totalExpenses = expenses.reduce(
        (acc, m) => acc + Number(m.amount),
        0,
      );

      results.push({
        day: String(day).padStart(2, '0'),
        profit: totalSales + totalIncomes - totalExpenses,
      });
    }

    return results;
  }
}
