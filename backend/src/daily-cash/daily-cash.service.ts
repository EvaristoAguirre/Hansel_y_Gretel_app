import { Injectable } from '@nestjs/common';
import { CreateDailyCashDto } from '../DTOs/create-daily-cash.dto';
import { UpdateDailyCashDto } from '../DTOs/update-daily-cash.dto';
import { DailyCashRepository } from './daily-cash.repository';

@Injectable()
export class DailyCashService {
  constructor(private readonly dailyCashRepository: DailyCashRepository) {}
  async createDailyCash(
    createDailyCashDto: CreateDailyCashDto,
  ): Promise<CreateDailyCashDto> {
    return await this.dailyCashRepository.create(createDailyCashDto);
  }
  async getAllDailyCash(): Promise<CreateDailyCashDto[]> {
    return await this.dailyCashRepository.getAllDailysCash();
  }
  async getDailyCashById(id: number): Promise<CreateDailyCashDto> {
    return await this.dailyCashRepository.getDailyCashById(id);
  }
  async updateDailyCash(
    id: number,
    updateDailyCashDto: UpdateDailyCashDto,
  ): Promise<UpdateDailyCashDto> {
    return await this.dailyCashRepository.updateDailyCash(
      id,
      updateDailyCashDto,
    );
  }
  async deleteDailyCash(id: number): Promise<void> {
    await this.dailyCashRepository.deleteDailyCash(id);
  }
}
