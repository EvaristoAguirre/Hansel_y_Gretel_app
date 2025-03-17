import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Repository } from 'typeorm';
import { Stock } from './stock.entity';
import { UpdateStockDto } from 'src/DTOs/update-stock.dto';
import { CreateStockDto } from 'src/DTOs/create-stock.dto';
import { Product } from 'src/Product/product.entity';
import { Ingredient } from 'src/Ingredient/ingredient.entity';
import { InjectRepository } from '@nestjs/typeorm';
// import { CreateStockDto } from 'src/DTOs/create-stock.dto';

@Injectable()
export class StockRepository {
  constructor(
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
  ) {}

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
        where: { ingredient: { id: ingredientId } },
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

  async createStock(createStockDto: CreateStockDto): Promise<Stock> {
    const { productId, ingredientId, quantityInStock, minimumStock } =
      createStockDto;

    if (productId && ingredientId) {
      throw new BadRequestException(
        'You cannot assign a stock to a product and an ingredient at the same time.',
      );
    }
    if (!productId && !ingredientId) {
      throw new BadRequestException(
        'You must provide either a productId or an ingredientId.',
      );
    }

    if (quantityInStock < 0 || minimumStock < 0) {
      throw new BadRequestException(
        'Quantity in stock and minimum stock must be greater than 0.',
      );
    }

    try {
      let product: Product | null = null;
      let ingredient: Ingredient | null = null;

      if (productId) {
        product = await this.productRepository.findOne({
          where: { id: productId },
        });
        if (!product) {
          throw new NotFoundException(
            `Product with ID ${productId} not found.`,
          );
        }
      } else if (ingredientId) {
        ingredient = await this.ingredientRepository.findOne({
          where: { id: ingredientId },
        });
        if (!ingredient) {
          throw new NotFoundException(
            `Ingredient with ID ${ingredientId} not found.`,
          );
        }
      }

      const stock = new Stock();
      stock.quantityInStock = quantityInStock;
      stock.minimumStock = minimumStock;

      if (product) {
        stock.product = product;
      } else if (ingredient) {
        stock.ingredient = ingredient;
      }

      return this.stockRepository.save(stock);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error creating the product.',
        error.message,
      );
    }
  }

  async updateStock(
    id: string,
    updateStockDto: UpdateStockDto,
  ): Promise<Stock> {
    const { productId, ingredientId, quantityInStock, minimumStock } =
      updateStockDto;

    if (!id) {
      throw new BadRequestException('Either ID must be provided.');
    }

    if (!productId && !ingredientId) {
      throw new BadRequestException(
        'You must provide either a productId or an ingredientId.',
      );
    }

    try {
      const stock = await this.stockRepository.findOne({
        where: { id },
        relations: ['product', 'ingredient'],
      });
      if (!stock) {
        throw new NotFoundException(`Stock with ID ${id} not found.`);
      }

      if (productId && ingredientId) {
        throw new BadRequestException(
          'You cannot assign a stock to a product and an ingredient at the same time',
        );
      }

      if (productId) {
        const product = await this.productRepository.findOne({
          where: { id: productId },
        });
        if (!product) {
          throw new NotFoundException(
            `Product with ID ${productId} not found.`,
          );
        }
        stock.product = product;
        stock.ingredient = null;
      } else if (ingredientId) {
        const ingredient = await this.ingredientRepository.findOne({
          where: { id: ingredientId },
        });
        if (!ingredient) {
          throw new NotFoundException(
            `Ingredient with ID ${ingredientId} not found.`,
          );
        }
        stock.ingredient = ingredient;
        stock.product = null;
      }

      if (quantityInStock !== undefined) {
        stock.quantityInStock = quantityInStock;
      }
      if (minimumStock !== undefined) {
        stock.minimumStock = minimumStock;
      }

      return this.stockRepository.save(stock);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error updating the product.',
        error.message,
      );
    }
  }
}
