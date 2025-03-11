import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { StockService } from './stock.service';
import { Stock } from './stock.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateStockDto } from 'src/DTOs/create-stock.dto';
import { UpdateStockDto } from 'src/DTOs/update-stock.dto';
import { Roles } from 'src/Decorators/roles.decorator';
import { UserRole } from 'src/Enums/roles.enum';
import { RolesGuard } from 'src/Guards/roles.guard';

@Controller('stock')
@UseGuards(RolesGuard)
export class StockController {
  constructor(
    private readonly stockService: StockService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async getAllStock(
    @Param('page') page: number = 1,
    @Param('limit') limit: number = 10,
  ): Promise<Stock[]> {
    return await this.stockService.getAllStocks(page, limit);
  }

  @Get('/product/:id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async getStockByProductId(
    @Param('productId') productId: string,
  ): Promise<Stock> {
    return await this.stockService.getStockByProductId(productId);
  }

  @Get('/ingredient/:id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async getStockByIngredientId(
    @Param('ingredientId') ingredientId: string,
  ): Promise<Stock> {
    return await this.stockService.getStockByIngredientId(ingredientId);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async createStock(@Body() createStockDto: CreateStockDto): Promise<Stock> {
    const createStock = await this.stockService.createStock(createStockDto);
    await this.eventEmitter.emit('stock.created', createStock);
    return createStock;
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO)
  async updateStock(
    @Param('id') id: string,
    @Body() updateStockDto: UpdateStockDto,
  ): Promise<Stock> {
    const updatedStock = await this.stockService.updateStock(
      id,
      updateStockDto,
    );
    await this.eventEmitter.emit('stock.updated', updatedStock);
    return updatedStock;
  }
}
