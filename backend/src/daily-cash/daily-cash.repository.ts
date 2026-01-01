/* eslint-disable @typescript-eslint/no-unused-vars */
import { BadRequestException, Injectable } from '@nestjs/common';
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

  async getAllDailysCash(
    page: number = 1,
    limit: number = 1000,
  ): Promise<DailyCash[]> {
    if (page < 1 || limit < 1) {
      throw new BadRequestException('Page and limit must be greater than 0');
    }
    try {
      return await this.dailyCashRepository.find({
        skip: (page - 1) * limit,
        take: limit,
        relations: ['movements', 'orders', 'orders.payments'],
        // ✅ Asegurar que las relaciones opcionales no causen problemas
      });
    } catch (error) {
      console.error('Error en getAllDailysCash repository:', error);
      throw error;
    }
  }

  async getDailyCashById(id: string): Promise<DailyCash> {
    return await this.dailyCashRepository.findOne({
      where: { id },
      relations: ['movements', 'orders', 'orders.payments'],
    });
  }

  async isAnyDailyCashOpen(): Promise<object> {
    const existingDailyCash = await this.dailyCashRepository.findOne({
      where: {
        state: DailyCashState.OPEN,
      },
    });
    return {
      exist: !!existingDailyCash,
      dailyCashOpenId: existingDailyCash?.id || null,
    };
  }
}
