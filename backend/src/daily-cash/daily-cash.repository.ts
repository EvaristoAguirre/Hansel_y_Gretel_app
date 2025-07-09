/* eslint-disable @typescript-eslint/no-unused-vars */
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DailyCash } from './daily-cash.entity';
import { Between, Repository } from 'typeorm';
import { DailyCashState } from 'src/Enums/states.enum';
import { CashMovement } from './cash-movement.entity';
@Injectable()
export class DailyCashRepository {
  constructor(
    @InjectRepository(DailyCash)
    private readonly dailyCashRepository: Repository<DailyCash>,
    @InjectRepository(CashMovement)
    private readonly cashMovementRepository: Repository<CashMovement>,
  ) {}

  async getAllDailysCash(page: number, limit: number): Promise<DailyCash[]> {
    return await this.dailyCashRepository.find({
      skip: (page - 1) * limit,
      take: limit,
      relations: ['movements', 'orders', 'orders.payments'],
    });
  }

  async getDailyCashById(id: string): Promise<DailyCash> {
    return await this.dailyCashRepository.findOne({
      where: { id },
      relations: ['movements', 'orders', 'orders.payments'],
    });
  }

  async isTodayDailyCashOpen(
    startOfDay: Date,
    endOfDay: Date,
  ): Promise<object> {
    const existingDailyCash = await this.dailyCashRepository.findOne({
      where: {
        date: Between(startOfDay, endOfDay),
        state: DailyCashState.OPEN,
      },
    });
    return {
      exist: !!existingDailyCash,
      dailyCashOpenId: existingDailyCash?.id || null,
    };
  }
}
