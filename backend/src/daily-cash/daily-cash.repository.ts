/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DailyCash } from './daily-cash.entity';
import { Between, Repository } from 'typeorm';
import { CreateDailyCashDto } from 'src/DTOs/create-daily-cash.dto';
import { UpdateDailyCashDto } from 'src/DTOs/update-daily-cash.dto';
import { isUUID } from 'class-validator';
import { DailyCashState } from 'src/Enums/states.enum';
import { CashMovement } from './cash-movement.entity';
import {
  RegisterExpenseDto,
  RegisterMovementDto,
} from 'src/DTOs/create-expense.dto';
import { UUID } from 'typeorm/driver/mongodb/bson.typings';
import { DailyCashMovementType } from 'src/Enums/dailyCash.enum';
import { CloseDailyCash } from 'src/DTOs/close-daily-cash.dto';
import { PaymentMethod } from 'src/Enums/paymentMethod.enum';

@Injectable()
export class DailyCashRepository {
  constructor(
    @InjectRepository(DailyCash)
    private readonly dailyCashRepository: Repository<DailyCash>,
    @InjectRepository(CashMovement)
    private readonly cashMovementRepository: Repository<CashMovement>,
  ) {}

  async openDailyCash(createDailyCashDto: CreateDailyCashDto) {
    if (!createDailyCashDto) {
      throw new BadRequestException('Daily cash data must be provided.');
    }
    try {
      const today = new Date();
      const existingDailyCash = await this.dailyCashRepository.findOne({
        where: {
          date: today,
        },
      });
      if (existingDailyCash) {
        throw new ConflictException(
          'A daily cash report for today already exists.',
        );
      }
      const dailyCash = this.dailyCashRepository.create(createDailyCashDto);
      dailyCash.date = today;
      dailyCash.state = DailyCashState.OPEN;
      dailyCash.initialCash = createDailyCashDto.initialCash || 0;
      await this.dailyCashRepository.save(dailyCash);
      return dailyCash;
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

  async getAllDailysCash(page: number, limit: number): Promise<DailyCash[]> {
    if (page <= 0 || limit <= 0) {
      throw new BadRequestException(
        'Page and limit must be positive integers.',
      );
    }
    try {
      return await this.dailyCashRepository.find({
        skip: (page - 1) * limit,
        take: limit,
        relations: ['movements', 'orders'],
      });
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
      const dailyCash = await this.dailyCashRepository.findOne({
        where: { id },
        relations: ['movements', 'orders'],
      });
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
      await this.dailyCashRepository.update(id, updateDailyCashDto);
      const updatedDailyCash = await this.getDailyCashById(id);
      if (!updatedDailyCash) {
        throw new NotFoundException('Daily cash report not found.');
      }
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
      const dailyCash = await this.getDailyCashById(id);
      if (!dailyCash) {
        throw new NotFoundException('Daily cash report not found.');
      }
      if (dailyCash.state === DailyCashState.CLOSED) {
        throw new ConflictException('Daily cash report is already closed.');
      }
      dailyCash.state = DailyCashState.CLOSED;
      dailyCash.comment = closeDailyCashDto.comment || '';

      const incomes = dailyCash.movements.filter(
        (mov) => mov.type === DailyCashMovementType.INCOME,
      );
      const expenses = dailyCash.movements.filter(
        (mov) => mov.type === DailyCashMovementType.EXPENSE,
      );
      // ----- Totales -----
      const totalSalesFromOrders = this.sumTotalOrders(dailyCash.orders);
      const totalIncomes = this.sumTotal(incomes);
      const totalExpenses = this.sumTotal(expenses);
      //------ Agrupacion por metodo de pago -----
      const orderPayments = this.groupRecordsByPaymentMethod(
        dailyCash.orders.map((o) => ({
          amount: Number(o.total),
          methodOfPayment: o.methodOfPayment,
        })),
      );
      const incomePayments = this.groupRecordsByPaymentMethod(incomes);
      const expensePayments = this.groupRecordsByPaymentMethod(expenses);

      // Total por método = ventas (órdenes + ingresos manuales)
      dailyCash.totalSales = totalSalesFromOrders + totalIncomes;
      dailyCash.totalPayments = totalExpenses;

      dailyCash.totalCash =
        (orderPayments[PaymentMethod.CASH] || 0) +
        (incomePayments[PaymentMethod.CASH] || 0);
      dailyCash.totalCreditCard =
        (orderPayments[PaymentMethod.CREDIT_CARD] || 0) +
        (incomePayments[PaymentMethod.CREDIT_CARD] || 0);
      dailyCash.totalDebitCard =
        (orderPayments[PaymentMethod.DEBIT_CARD] || 0) +
        (incomePayments[PaymentMethod.DEBIT_CARD] || 0);
      dailyCash.totalTransfer =
        (orderPayments[PaymentMethod.TRANSFER] || 0) +
        (incomePayments[PaymentMethod.TRANSFER] || 0);
      dailyCash.totalMercadoPago =
        (orderPayments[PaymentMethod.MERCADOPAGO] || 0) +
        (incomePayments[PaymentMethod.MERCADOPAGO] || 0);

      return await this.dailyCashRepository.save(dailyCash);
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

  async deleteDailyCash(id: number) {
    return await this.dailyCashRepository.delete(id);
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
      const dailyCash = await this.getDailyCashById(expenseData.dailyCashId);
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

      return await this.cashMovementRepository.save(cashMovement);
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
    const { dailyCashId, movementType, payments, description } = movementData;

    if (!movementData.dailyCashId || !isUUID(movementData.dailyCashId)) {
      throw new BadRequestException('Daily cash ID must be provided.');
    }

    if (!payments || payments.length === 0) {
      throw new BadRequestException(
        'At least one payment method must be provided.',
      );
    }

    try {
      const dailyCash = await this.getDailyCashById(dailyCashId);
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

      await this.cashMovementRepository.save(cashMovement);
      await this.dailyCashRepository.save(dailyCash);
      const movement = await this.cashMovementRepository.findOne({
        where: { id: cashMovement.id },
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

  async isTodayDailyCashOpen(): Promise<boolean> {
    try {
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const existingDailyCash = await this.dailyCashRepository.findOne({
        where: {
          date: Between(startOfDay, endOfDay),
          state: DailyCashState.OPEN,
        },
      });
      return !!existingDailyCash;
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Error checking if daily cash is open. Please try again later.',
        error.message,
      );
    }
  }

  async getIncomesByDailyCashId(dailyCashId: string) {
    if (!dailyCashId) {
      throw new BadRequestException('Daily Cash ID must be provided.');
    }
    if (!isUUID(dailyCashId)) {
      throw new BadRequestException(
        'Invalid Daily Cash ID format. ID must be a valid UUID.',
      );
    }
    try {
      return await this.cashMovementRepository.find({
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

  async getExpensesByDailyCashId(dailyCashId: string) {
    if (!dailyCashId) {
      throw new BadRequestException('Daily Cash ID must be provided.');
    }
    if (!isUUID(dailyCashId)) {
      throw new BadRequestException(
        'Invalid Daily Cash ID format. ID must be a valid UUID.',
      );
    }
    try {
      return await this.cashMovementRepository.find({
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
