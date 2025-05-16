import { Injectable } from '@nestjs/common';
import { CreateDailyCashDto } from '../DTOs/create-daily-cash.dto';
import { UpdateDailyCashDto } from '../DTOs/update-daily-cash.dto';
import { DailyCashRepository } from './daily-cash.repository';
import { DailyCash } from './daily-cash.entity';

@Injectable()
export class DailyCashService {
  constructor(private readonly dailyCashRepository: DailyCashRepository) {}

  async openDailyCash(
    createDailyCashDto: CreateDailyCashDto,
  ): Promise<DailyCash> {
    return await this.dailyCashRepository.openDailyCash(createDailyCashDto);
  }
  async getAllDailyCash(page: number, limit: number): Promise<DailyCash[]> {
    return await this.dailyCashRepository.getAllDailysCash(page, limit);
  }
  async getDailyCashById(id: string): Promise<DailyCash> {
    return await this.dailyCashRepository.getDailyCashById(id);
  }
  async updateDailyCash(id: number, updateDailyCashDto: UpdateDailyCashDto) {
    return await this.dailyCashRepository.updateDailyCash(
      id,
      updateDailyCashDto,
    );
  }

  async closeDailyCash(
    id: string,
    updateDailyCashDto: UpdateDailyCashDto,
  ): Promise<DailyCash> {
    return await this.dailyCashRepository.closeDailyCash(
      id,
      updateDailyCashDto,
    );
  }

  async deleteDailyCash(id: number): Promise<void> {
    await this.dailyCashRepository.deleteDailyCash(id);
  }
}
