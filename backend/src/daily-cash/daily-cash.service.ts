import { Injectable } from '@nestjs/common';
import { CreateDailyCashDto } from '../DTOs/create-daily-cash.dto';
import { UpdateDailyCashDto } from '../DTOs/update-daily-cash.dto';
import { DailyCashRepository } from './daily-cash.repository';
import { DailyCash } from './daily-cash.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { RegisterExpenseDto } from 'src/DTOs/create-expense.dto';
import { CashMovement } from './cash-movement.entity';

@Injectable()
export class DailyCashService {
  constructor(
    private readonly dailyCashRepository: DailyCashRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async openDailyCash(
    createDailyCashDto: CreateDailyCashDto,
  ): Promise<DailyCash> {
    const dailyCashOpened =
      await this.dailyCashRepository.openDailyCash(createDailyCashDto);
    await this.eventEmitter.emit('dailyCash.opened', {
      dailyCash: dailyCashOpened,
    });
    return dailyCashOpened;
  }
  async getAllDailyCash(page: number, limit: number): Promise<DailyCash[]> {
    return await this.dailyCashRepository.getAllDailysCash(page, limit);
  }
  async getDailyCashById(id: string): Promise<DailyCash> {
    return await this.dailyCashRepository.getDailyCashById(id);
  }
  async updateDailyCash(id: string, updateDailyCashDto: UpdateDailyCashDto) {
    const dailyCashUpdated = await this.dailyCashRepository.updateDailyCash(
      id,
      updateDailyCashDto,
    );
    await this.eventEmitter.emit('dailyCash.updated', {
      dailyCash: dailyCashUpdated,
    });
    return dailyCashUpdated;
  }

  async closeDailyCash(
    id: string,
    updateDailyCashDto: UpdateDailyCashDto,
  ): Promise<DailyCash> {
    const dailyCashClosed = await this.dailyCashRepository.closeDailyCash(
      id,
      updateDailyCashDto,
    );
    await this.eventEmitter.emit('dailyCash.closed', {
      dailyCash: dailyCashClosed,
    });
    return dailyCashClosed;
  }

  async deleteDailyCash(id: number): Promise<void> {
    await this.dailyCashRepository.deleteDailyCash(id);
  }

  async registerExpense(
    expenseData: RegisterExpenseDto,
  ): Promise<CashMovement> {
    return await this.dailyCashRepository.registerExpense(expenseData);
  }

  async isTodayDailyCashOpen(): Promise<boolean> {
    return await this.dailyCashRepository.isTodayDailyCashOpen();
  }
}
