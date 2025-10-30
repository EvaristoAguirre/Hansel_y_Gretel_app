import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { StockService } from './stock.service';
import { Stock } from './stock.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CreateStockDto } from 'src/DTOs/create-stock.dto';
import { UpdateStockDto } from 'src/DTOs/update-stock.dto';
import { AddStockDto } from 'src/DTOs/add-stock.dto';
import { Roles } from 'src/Decorators/roles.decorator';
import { UserRole } from 'src/Enums/roles.enum';
import { RolesGuard } from 'src/Guards/roles.guard';
import { DeductStockDto } from 'src/DTOs/deduct-stock.dto';
import { StockSummaryResponseDTO } from 'src/DTOs/stockSummaryResponse.dto';

@Controller('stock')
@UseGuards(RolesGuard)
export class StockController {
  constructor(
    private readonly stockService: StockService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.INVENTARIO)
  async getAllStock(
    @Param('page') page: number = 1,
    @Param('limit') limit: number = 10,
  ): Promise<StockSummaryResponseDTO[]> {
    return await this.stockService.getAllStocks(page, limit);
  }

  @Get('/product/:id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.INVENTARIO)
  async getStockByProductId(
    @Param('id') id: string,
  ): Promise<StockSummaryResponseDTO> {
    return await this.stockService.getStockByProductId(id);
  }

  @Get('/ingredient/:id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.INVENTARIO)
  async getStockByIngredientId(
    @Param('id') id: string,
  ): Promise<StockSummaryResponseDTO> {
    return await this.stockService.getStockByIngredientId(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.INVENTARIO)
  async createStock(@Body() createStockDto: CreateStockDto): Promise<Stock> {
    const createStock = await this.stockService.createStock(createStockDto);
    await this.eventEmitter.emit('stock.created', createStock);
    return createStock;
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.INVENTARIO)
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

  @Patch(':id/add')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.INVENTARIO)
  async addStock(
    @Param('id') id: string,
    @Body() addStockDto: AddStockDto,
  ): Promise<Stock> {
    const updatedStock = await this.stockService.addStock(id, addStockDto);
    await this.eventEmitter.emit('stock.updated', updatedStock);
    return updatedStock;
  }

  @Put('/deduct')
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.INVENTARIO)
  async deductStock(@Body() deductStockDto: DeductStockDto): Promise<string> {
    const { productId, quantity } = deductStockDto;
    return await this.stockService.deductStock(productId, quantity);
    // await this.eventEmitter.emit('stock.updated', updatedStock);
    // return updatedStock;
  }
}
