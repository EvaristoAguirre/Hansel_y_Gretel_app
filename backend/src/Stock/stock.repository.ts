import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Stock } from './stock.entity';
// import { UpdateStockDto } from 'src/DTOs/update-stock.dto';

@Injectable()
export class StockRepository {
  constructor(private readonly stockRepository: Repository<Stock>) {}

  async getAllStocks(page: number, limit: number): Promise<Stock[]> {
    if (page <= 0 || limit <= 0) {
      throw new BadRequestException(
        'Page and limit must be positive integers.',
      );
    }
    try {
      return await this.stockRepository.find({
        skip: (page - 1) * limit,
        take: limit,
        relations: ['ingredient', 'product'],
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        'Error fetching orders',
        error.message,
      );
    }
  }

  async getStockByProductId(productId: string): Promise<Stock> {
    if (!productId) {
      throw new BadRequestException('Either ID must be provided.');
    }
    try {
      const stock = await this.stockRepository.findOne({
        where: { product: { id: productId } },
        relations: ['product'],
      });

      if (!stock) {
        throw new NotFoundException(
          `Stock not found for product with ID ${productId}`,
        );
      }

      return stock;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error fetching stock',
        error.message,
      );
    }
  }

  async getStockByIngredientId(ingredientId: string): Promise<Stock> {
    if (!ingredientId) {
      throw new BadRequestException('Either ID must be provided.');
    }
    try {
      const stock = await this.stockRepository.findOne({
        where: { product: { id: ingredientId } },
        relations: ['ingredient'],
      });

      if (!stock) {
        throw new NotFoundException(
          `Stock not found for product with ID ${ingredientId}`,
        );
      }

      return stock;
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error fetching stock',
        error.message,
      );
    }
  }

  // async updateStock(id: string, updateData: UpdateStockDto): Promise<Stock> {
  //   if (!id) {
  //     throw new BadRequestException('Stock ID must be provided.');
  //   }
  // }
}
