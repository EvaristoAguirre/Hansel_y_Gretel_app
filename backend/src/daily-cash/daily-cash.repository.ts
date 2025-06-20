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
import { RegisterExpenseDto } from 'src/DTOs/create-expense.dto';
import { UUID } from 'typeorm/driver/mongodb/bson.typings';
import { DailyCashMovementType } from 'src/Enums/dailyCash.enum';

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
    updateDailyCashDto: UpdateDailyCashDto,
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
      const cashMovement = new CashMovement();
      cashMovement.type = DailyCashMovementType.EXPENSE;
      cashMovement.amount = expenseData.amount;
      cashMovement.description = expenseData.description || '';
      cashMovement.paymentMethod = expenseData.paymentMethod;
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
}
