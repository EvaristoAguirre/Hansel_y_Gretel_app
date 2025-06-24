import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Stock } from './stock.entity';
import { Product } from 'src/Product/product.entity';
import { Ingredient } from 'src/Ingredient/ingredient.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { StockSummaryResponseDTO } from 'src/DTOs/stockSummaryResponse.dto';
import { UnitOfMeasure } from 'src/UnitOfMeasure/unitOfMesure.entity';
import { isUUID } from 'class-validator';
import { StockToExportResponseDTO } from 'src/DTOs/stockToExportResponse.dto';

@Injectable()
export class StockRepository {
  constructor(
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
  ) {}

  async getAllStocks(
    page: number,
    limit: number,
  ): Promise<StockSummaryResponseDTO[]> {
    if (page <= 0 || limit <= 0) {
      throw new BadRequestException(
        'Page and limit must be positive integers.',
      );
    }

    try {
      const stocks = await this.stockRepository.find({
        skip: (page - 1) * limit,
        take: limit,
        relations: ['ingredient', 'product', 'unitOfMeasure'],
      });

      return this.adaptStocksResponse(stocks);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException(
        'Error fetching stocks',
        error.message,
      );
    }
  }

  async getStockByProductId(
    productId: string,
  ): Promise<StockSummaryResponseDTO> {
    if (!productId) {
      throw new BadRequestException('Either ID must be provided.');
    }
    if (!isUUID(productId)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
    }
    try {
      const stock = await this.stockRepository.findOne({
        where: { product: { id: productId } },
        relations: ['product', 'unitOfMeasure'],
      });

      if (!stock) {
        throw new NotFoundException('Stock not found');
      }

      return this.adaptStockResponse(stock);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Error fetching stock',
        error.message,
      );
    }
  }

  async getStockByIngredientId(
    ingredientId: string,
  ): Promise<StockSummaryResponseDTO> {
    if (!ingredientId) {
      throw new BadRequestException('Either ID must be provided.');
    }
    if (!isUUID(ingredientId)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
    }
    try {
      const stock = await this.stockRepository.findOne({
        where: {
          ingredient: { id: ingredientId },
        },
        relations: ['ingredient', 'unitOfMeasure'],
      });
      if (!stock) {
        throw new NotFoundException('Stock not found');
      }

      return this.adaptStockResponse(stock);
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Error fetching stock',
        error.message,
      );
    }
  }

  async createAndSaveStock(
    quantityInStock: number,
    minimumStock: number,
    unitOfMeasure: UnitOfMeasure,
    product?: Product,
    ingredient?: Ingredient,
  ): Promise<Stock> {
    const stock = this.stockRepository.create({
      quantityInStock,
      minimumStock,
      unitOfMeasure,
      product: product ?? null,
      ingredient: ingredient ?? null,
    });

    return this.stockRepository.save(stock);
  }

  async saveStock(stock: Stock): Promise<Stock> {
    return this.stockRepository.save(stock);
  }

  async findStockById(id: string): Promise<Stock | null> {
    return this.stockRepository.findOne({
      where: { id },
      relations: ['product', 'ingredient'],
    });
  }

  private adaptStockResponse(stock: any): StockSummaryResponseDTO {
    return {
      id: stock.id,
      quantityInStock: stock.quantityInStock,
      minimumStock: stock.minimumStock,
      ingredient: stock.ingredient
        ? {
            id: stock.ingredient.id,
            name: stock.ingredient.name,
            cost: stock.ingredient.cost,
            isTopping: stock.ingredient.isTopping,
          }
        : null,
      product: stock.product
        ? {
            id: stock.product.id,
            name: stock.product.name,
            cost: stock.product.cost,
          }
        : null,
      unitOfMeasure: {
        id: stock.unitOfMeasure.id,
        name: stock.unitOfMeasure.name,
        abbreviation: stock.unitOfMeasure.abbreviation,
      },
    };
  }

  private adaptStocksResponse(stocks: any[]): StockSummaryResponseDTO[] {
    return stocks.map(this.adaptStockResponse);
  }

  private adaptStockToExportResponse(stock: any): StockToExportResponseDTO {
    return {
      quantityInStock: stock.quantityInStock,
      ingredient: stock.ingredient
        ? {
            name: stock.ingredient.name,
            cost: stock.ingredient.cost,
          }
        : null,
      product: stock.product
        ? {
            name: stock.product.name,
            cost: stock.product.cost,
          }
        : null,
      unitOfMeasure: {
        name: stock.unitOfMeasure.name,
        abbreviation: stock.unitOfMeasure.abbreviation,
      },
    };
  }

  private adaptStocksToExportResponse(
    stocks: any[],
  ): StockToExportResponseDTO[] {
    return stocks.map(this.adaptStockToExportResponse);
  }
}
