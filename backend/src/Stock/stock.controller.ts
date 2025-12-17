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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
  ApiBearerAuth,
} from '@nestjs/swagger';
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

@ApiTags('Stock')
@ApiBearerAuth('JWT-auth')
@Controller('stock')
@UseGuards(RolesGuard)
export class StockController {
  constructor(
    private readonly stockService: StockService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Get()
  @ApiOperation({
    summary: 'Obtener todo el stock',
    description:
      'Devuelve una lista de todo el inventario (productos e ingredientes)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de stock obtenida exitosamente',
  })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.INVENTARIO)
  async getAllStock(
    @Param('page') page: number = 1,
    @Param('limit') limit: number = 10,
  ): Promise<StockSummaryResponseDTO[]> {
    return await this.stockService.getAllStocks(page, limit);
  }

  @Get('/product/:id')
  @ApiOperation({
    summary: 'Obtener stock de un producto',
    description: 'Devuelve el stock de un producto específico',
  })
  @ApiParam({ name: 'id', type: String, description: 'UUID del producto' })
  @ApiResponse({ status: 200, description: 'Stock del producto encontrado' })
  @ApiResponse({ status: 404, description: 'Producto no encontrado' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.INVENTARIO)
  async getStockByProductId(
    @Param('id') id: string,
  ): Promise<StockSummaryResponseDTO> {
    return await this.stockService.getStockByProductId(id);
  }

  @Get('/ingredient/:id')
  @ApiOperation({
    summary: 'Obtener stock de un ingrediente',
    description: 'Devuelve el stock de un ingrediente específico',
  })
  @ApiParam({ name: 'id', type: String, description: 'UUID del ingrediente' })
  @ApiResponse({ status: 200, description: 'Stock del ingrediente encontrado' })
  @ApiResponse({ status: 404, description: 'Ingrediente no encontrado' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.INVENTARIO)
  async getStockByIngredientId(
    @Param('id') id: string,
  ): Promise<StockSummaryResponseDTO> {
    return await this.stockService.getStockByIngredientId(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Crear registro de stock',
    description:
      'Crea un nuevo registro de stock para un producto o ingrediente',
  })
  @ApiBody({
    type: CreateStockDto,
    description: 'Datos del stock',
    examples: {
      producto: {
        summary: 'Stock de producto',
        value: {
          productId: 'uuid-producto',
          quantity: 100,
          minStock: 10,
        },
      },
      ingrediente: {
        summary: 'Stock de ingrediente',
        value: {
          ingredientId: 'uuid-ingrediente',
          quantity: 50,
          minStock: 5,
        },
      },
    },
  })
  @ApiResponse({ status: 201, description: 'Stock creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.INVENTARIO)
  async createStock(@Body() createStockDto: CreateStockDto): Promise<Stock> {
    const createStock = await this.stockService.createStock(createStockDto);
    await this.eventEmitter.emit('stock.created', createStock);
    return createStock;
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar stock',
    description: 'Actualiza los datos de un registro de stock existente',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID del registro de stock',
  })
  @ApiBody({ type: UpdateStockDto, description: 'Datos a actualizar' })
  @ApiResponse({ status: 200, description: 'Stock actualizado exitosamente' })
  @ApiResponse({ status: 404, description: 'Stock no encontrado' })
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
  @ApiOperation({
    summary: 'Agregar stock',
    description: 'Suma cantidad al stock existente (ingreso de mercadería)',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'UUID del registro de stock',
  })
  @ApiBody({
    type: AddStockDto,
    description: 'Cantidad a agregar',
    examples: {
      ejemplo: {
        value: { quantity: 50, cost: 1000, note: 'Compra proveedor X' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Stock agregado exitosamente' })
  @ApiResponse({ status: 404, description: 'Stock no encontrado' })
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
  @ApiOperation({
    summary: 'Descontar stock',
    description: 'Resta cantidad del stock (venta, merma, etc.)',
  })
  @ApiBody({
    type: DeductStockDto,
    description: 'Datos para descontar stock',
    examples: {
      ejemplo: {
        value: { productId: 'uuid-producto', quantity: 5 },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Stock descontado exitosamente' })
  @ApiResponse({ status: 400, description: 'Stock insuficiente' })
  @Roles(UserRole.ADMIN, UserRole.ENCARGADO, UserRole.INVENTARIO)
  async deductStock(@Body() deductStockDto: DeductStockDto): Promise<string> {
    const { productId, quantity } = deductStockDto;
    return await this.stockService.deductStock(productId, quantity);
  }
}
