import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { StockService } from './stock.service';
import { Stock } from './stock.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Controller('stock')
export class StockController {
  constructor(
    private readonly stockService: StockService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Get()
  async getAllStock(
    @Param() page: number,
    @Param() limit: number,
  ): Promise<Stock[]> {
    return await this.stockService.getAllStocks(page, limit);
  }

  @Get('/product/:id')
  async getStockByProductId(@Param() productId: string): Promise<Stock> {
    return await this.stockService.getStockByProductId(productId);
  }

  @Get('/ingredient/:id')
  async getStockByIngredientId(@Param() ingredientId: string): Promise<Stock> {
    return await this.stockService.getStockByIngredientId(ingredientId);
  }

  @Post()
  async createStock(@Body() createStockDto: Stock): Promise<Stock> {
    const createStock = await this.stockService.createStock(createStockDto);
    await this.eventEmitter.emit('stock.created', createStock);
    return createStock;
  }

  @Patch(':id')
  async updateStock(
    @Param() id: string,
    @Body() updateStockDto: Stock,
  ): Promise<Stock> {
    const updatedStock = await this.stockService.updateStock(
      id,
      updateStockDto,
    );
    await this.eventEmitter.emit('stock.updated', updatedStock);
    return updatedStock;
  }
}
