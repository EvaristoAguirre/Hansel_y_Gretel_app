import { Injectable } from '@nestjs/common';
import { Stock } from './stock.entity';
import { CreateStockDto } from 'src/DTOs/create-stock.dto';
import { UpdateStockDto } from 'src/DTOs/update-stock.dto';

@Injectable()
export class StockService {
  constructor(private readonly stockService: StockService) {}

  async getAllStocks(page: number, limit: number): Promise<Stock[]> {
    return await this.stockService.getAllStocks(page, limit);
  }

  async getStockByProductId(productId: string): Promise<Stock> {
    return await this.stockService.getStockByProductId(productId);
  }

  async getStockByIngredientId(ingredientId: string): Promise<Stock> {
    return await this.stockService.getStockByIngredientId(ingredientId);
  }

  async createStock(createStockDto: CreateStockDto): Promise<Stock> {
    return await this.stockService.createStock(createStockDto);
  }

  async updateStock(
    id: string,
    updateStockDto: UpdateStockDto,
  ): Promise<Stock> {
    return await this.stockService.updateStock(id, updateStockDto);
  }
}
