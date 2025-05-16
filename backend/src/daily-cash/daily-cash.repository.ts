import {
  BadRequestException,
  ConflictException,
  HttpException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DailyCash } from './daily-cash.entity';
import { Repository } from 'typeorm';
import { CreateDailyCashDto } from 'src/DTOs/create-daily-cash.dto';
import { UpdateDailyCashDto } from 'src/DTOs/update-daily-cash.dto';
import { isUUID } from 'class-validator';
import { DailyCashState } from 'src/Enums/states.enum';

@Injectable()
export class DailyCashRepository {
  constructor(
    @InjectRepository(DailyCash)
    private readonly dailyCashRepository: Repository<DailyCash>,
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
        'Error openning the daily cash reposrt. Please try again later.',
        error.message,
      );
    }
    return await this.dailyCashRepository.save(createDailyCashDto);
  }

  async getAllDailysCash(page: number, limit: number) {
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

  async getDailyCashById(id: string) {
    if (!id) {
      throw new BadRequestException('Daily cash report ID must be provided.');
    }
    if (!isUUID(id)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
    }
    try {
      return await this.dailyCashRepository.findOne({
        where: { id },
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

  async updateDailyCash(id: number, updateDailyCashDto: UpdateDailyCashDto) {
    return await this.dailyCashRepository.update(id, updateDailyCashDto);
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
        throw new BadRequestException('Daily cash report not found.');
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
}
