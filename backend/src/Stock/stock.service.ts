import { Injectable } from '@nestjs/common';
import { Stock } from './stock.entity';
import { CreateStockDto } from 'src/DTOs/create-stock.dto';
import { UpdateStockDto } from 'src/DTOs/update-stock.dto';
import { StockRepository } from './stock.repository';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { StockSummaryResponseDTO } from 'src/DTOs/stockSummaryResponse.dto';

@Injectable()
export class StockService {
  constructor(
    private readonly stockRepository: StockRepository,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async getAllStocks(
    page: number,
    limit: number,
  ): Promise<StockSummaryResponseDTO[]> {
    return await this.stockRepository.getAllStocks(page, limit);
  }

  async getStockByProductId(
    productId: string,
  ): Promise<StockSummaryResponseDTO> {
    return await this.stockRepository.getStockByProductId(productId);
  }

  async getStockByIngredientId(
    ingredientId: string,
  ): Promise<StockSummaryResponseDTO> {
    return await this.stockRepository.getStockByIngredientId(ingredientId);
  }

  async createStock(createStock: CreateStockDto): Promise<Stock> {
    const createdStock = await this.stockRepository.createStock(createStock);
    await this.eventEmitter.emit('stock.created', { stock: createdStock });
    return createdStock;
  }

  async updateStock(
    id: string,
    updateStockDto: UpdateStockDto,
  ): Promise<Stock> {
    const updatedStock = await this.stockRepository.updateStock(
      id,
      updateStockDto,
    );
    await this.eventEmitter.emit('stock.updated', { stock: updatedStock });
    return updatedStock;
  }

  async deductStock(productId: string, quantity: number) {
    const stockDeducted = await this.stockRepository.deductStock(
      productId,
      quantity,
    );
    await this.eventEmitter.emit('stock.updated', { stockDeducted });
    return stockDeducted;
  }
}
