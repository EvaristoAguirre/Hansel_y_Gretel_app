import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Stock } from './stock.entity';

@Injectable()
export class StockRepository {
  constructor(private readonly stockrepository: Repository<Stock>) {}

  async getAllStocks(page: number, limit: number): Promise<Stock[]> {
    if (page <= 0 || limit <= 0) {
      throw new BadRequestException(
        'Page and limit must be positive integers.',
      );
    }
    try {
      return await this.stockrepository.find({
        skip: (page - 1) * limit,
        take: limit,
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        'Error fetching orders',
        error.message,
      );
    }
  }
}
