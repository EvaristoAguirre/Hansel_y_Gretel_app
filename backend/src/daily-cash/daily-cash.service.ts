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

@Injectable()
export class DailyCashService {
  constructor(
    @InjectRepository(DailyCash)
    private readonly dailyCashRepo: Repository<DailyCash>,
    @InjectRepository(CashMovement)
    private readonly cashMovementRepo: Repository<CashMovement>,
    private readonly dailyCashRepository: DailyCashRepository,
    private readonly eventEmitter: EventEmitter2,
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

      this.eventEmitter.emit('dailyCash.opened', {
        dailyCash: dailyCashOpened,
      });

      return dailyCashOpened;
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
      return await this.dailyCashRepository.getAllDailysCash(page, limit);
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
        throw new BadRequestException('Daily cash report not found.');
      }
      return dailyCash;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Daily cash not found. Please try again later.',
        error.message,
      );
    }
    return await this.dailyCashRepository.getDailyCashById(id);
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

      return updatedDailyCash;
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

      // --- Filtrado de movimientos ---
      const incomes = dailyCash.movements.filter(
        (mov) => mov.type === DailyCashMovementType.INCOME,
      );
      const expenses = dailyCash.movements.filter(
        (mov) => mov.type === DailyCashMovementType.EXPENSE,
      );

      // --- Totales generales ---
      const totalSalesFromOrders = this.sumTotalOrders(dailyCash.orders);
      const totalIncomes = this.sumTotal(incomes);
      const totalExpenses = this.sumTotal(expenses);

      // --- Agrupación por método de pago ---
      const orderPayments = this.groupRecordsByPaymentMethod(
        dailyCash.orders.map((o) => ({
          amount: Number(o.total),
          methodOfPayment: o.methodOfPayment,
        })),
      );
      const incomePayments = this.groupRecordsByPaymentMethod(incomes);
      const expensePayments = this.groupRecordsByPaymentMethod(expenses);

      // --- Totales por método (ventas + ingresos - egresos) ---
      const totalCashSales =
        (orderPayments[PaymentMethod.CASH] || 0) +
        (incomePayments[PaymentMethod.CASH] || 0);
      const totalCashExpenses = expensePayments[PaymentMethod.CASH] || 0;
      dailyCash.totalCash = totalCashSales - totalCashExpenses;

      const totalCreditSales =
        (orderPayments[PaymentMethod.CREDIT_CARD] || 0) +
        (incomePayments[PaymentMethod.CREDIT_CARD] || 0);
      const totalCreditExpenses =
        expensePayments[PaymentMethod.CREDIT_CARD] || 0;
      dailyCash.totalCreditCard = totalCreditSales - totalCreditExpenses;

      const totalDebitSales =
        (orderPayments[PaymentMethod.DEBIT_CARD] || 0) +
        (incomePayments[PaymentMethod.DEBIT_CARD] || 0);
      const totalDebitExpenses = expensePayments[PaymentMethod.DEBIT_CARD] || 0;
      dailyCash.totalDebitCard = totalDebitSales - totalDebitExpenses;

      const totalTransferSales =
        (orderPayments[PaymentMethod.TRANSFER] || 0) +
        (incomePayments[PaymentMethod.TRANSFER] || 0);
      const totalTransferExpenses =
        expensePayments[PaymentMethod.TRANSFER] || 0;
      dailyCash.totalTransfer = totalTransferSales - totalTransferExpenses;

      const totalMPsales =
        (orderPayments[PaymentMethod.MERCADOPAGO] || 0) +
        (incomePayments[PaymentMethod.MERCADOPAGO] || 0);
      const totalMPexpenses = expensePayments[PaymentMethod.MERCADOPAGO] || 0;
      dailyCash.totalMercadoPago = totalMPsales - totalMPexpenses;

      // --- Totales globales ---
      dailyCash.totalSales = totalSalesFromOrders + totalIncomes;
      dailyCash.totalPayments = totalExpenses;

      // 💰 Saldo final proyectado (podés guardar esta propiedad si existe en la entidad)
      dailyCash.finalCash = dailyCash.initialCash + dailyCash.totalCash;

      const dailyCashClosed = await this.dailyCashRepo.save(dailyCash);

      this.eventEmitter.emit('dailyCash.closed', {
        dailyCash: dailyCashClosed,
      });

      return dailyCashClosed;
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
      return movement;
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

      return movement;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Error registering the expense. Please try again later.',
        error.message,
      );
    }
  }

  async isTodayDailyCashOpen(): Promise<object> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));
      return await this.dailyCashRepository.isTodayDailyCashOpen(
        startOfDay,
        endOfDay,
      );
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Error checking if daily cash is open. Please try again later.',
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
      return await this.cashMovementRepo.find({
        where: {
          dailyCash: { id: dailyCashId },
          type: DailyCashMovementType.INCOME,
        },
      });
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
      return await this.cashMovementRepo.find({
        where: {
          dailyCash: { id: dailyCashId },
          type: DailyCashMovementType.EXPENSE,
        },
      });
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

    return await this.dailyCashRepo.findOne({
      where: {
        date: Between(startOfDay, endOfDay),
        state: DailyCashState.OPEN,
      },
    });
  }

  private sumTotal(records: { amount: number }[]): number {
    return records.reduce((acc, r) => acc + Number(r.amount), 0);
  }

  private sumTotalOrders(records: { total: number }[]): number {
    return records.reduce((acc, r) => acc + Number(r.total), 0);
  }

  private groupRecordsByPaymentMethod(
    records: {
      amount: number;
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

    for (const record of records) {
      if (record.methodOfPayment && typeof record.amount === 'number') {
        totals[record.methodOfPayment] += record.amount;
      }

      if (record.payments && Array.isArray(record.payments)) {
        for (const p of record.payments) {
          totals[p.paymentMethod] += Number(p.amount);
        }
      }
    }

    return totals;
  }
}
