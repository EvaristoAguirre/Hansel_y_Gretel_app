import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DailyCash } from './daily-cash.entity';
import { Repository } from 'typeorm';
import { CreateDailyCashDto } from 'src/DTOs/create-daily-cash.dto';
import { UpdateDailyCashDto } from 'src/DTOs/update-daily-cash.dto';

@Injectable()
export class DailyCashRepository {
  constructor(
    @InjectRepository(DailyCash)
    private readonly dailyCashRepository: Repository<DailyCash>,
  ) {}

  async create(createDailyCashDto: CreateDailyCashDto) {
    return await this.dailyCashRepository.save(createDailyCashDto);
  }

  async getAllDailysCash() {
    return await this.dailyCashRepository.find();
  }

  async getDailyCashById(id: number) {
    return await this.dailyCashRepository.findOne({
      where: { id },
    });
  }

  async updateDailyCash(id: number, updateDailyCashDto: UpdateDailyCashDto) {
    return await this.dailyCashRepository.update(id, updateDailyCashDto);
  }

  async deleteDailyCash(id: number) {
    return await this.dailyCashRepository.delete(id);
  }
}
