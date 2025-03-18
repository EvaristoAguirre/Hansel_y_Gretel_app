import { Injectable } from '@nestjs/common';
import { Stock } from './stock.entity';
import { CreateStockDto } from 'src/DTOs/create-stock.dto';
import { UpdateStockDto } from 'src/DTOs/update-stock.dto';
import { StockRepository } from './stock.repository';

@Injectable()
export class StockService {
  constructor(private readonly stockRepository: StockRepository) {}

  async getAllStocks(page: number, limit: number): Promise<Stock[]> {
    return await this.stockRepository.getAllStocks(page, limit);
  }

  async getStockByProductId(productId: string): Promise<Stock> {
    return await this.stockRepository.getStockByProductId(productId);
  }

  async getStockByIngredientId(ingredientId: string): Promise<Stock> {
    return await this.stockRepository.getStockByIngredientId(ingredientId);
  }

  async createStock(createStockDto: CreateStockDto): Promise<Stock> {
    return await this.stockRepository.createStock(createStockDto);
  }

  async updateStock(
    id: string,
    updateStockDto: UpdateStockDto,
  ): Promise<Stock> {
    return await this.stockRepository.updateStock(id, updateStockDto);
  }

  async deductStock(
    productId: string,
    quantity: number,
    unitOfMeasureId: string,
  ) {
    return await this.stockRepository.deductStock(
      productId,
      quantity,
      unitOfMeasureId,
    );
  }
}
