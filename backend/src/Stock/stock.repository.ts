/* eslint-disable @typescript-eslint/no-unused-vars */
import {
  BadRequestException,
  HttpException,
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
import { IngredientService } from 'src/Ingredient/ingredient.service';
import { PromotionProduct } from 'src/Product/promotionProducts.entity';
import { StockSummaryResponseDTO } from 'src/DTOs/stockSummaryResponse.dto';
import { UnitOfMeasure } from 'src/UnitOfMeasure/unitOfMesure.entity';
import { UnitOfMeasureService } from 'src/UnitOfMeasure/unitOfMeasure.service';
import { isUUID } from 'class-validator';

@Injectable()
export class StockRepository {
  constructor(
    @InjectRepository(Stock)
    private readonly stockRepository: Repository<Stock>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Ingredient)
    private readonly ingredientRepository: Repository<Ingredient>,
    @InjectRepository(UnitOfMeasure)
    private readonly unitOfMeasureRepository: Repository<UnitOfMeasure>,
    @InjectRepository(PromotionProduct)
    private readonly promotionProductRepository: Repository<PromotionProduct>,
    private readonly ingredientService: IngredientService,
    private readonly unitOfMeasureService: UnitOfMeasureService,
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
        where: { id: productId },
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
        where: { id: ingredientId },
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

  async createStock(createStockDto: CreateStockDto): Promise<Stock> {
    const {
      productId,
      ingredientId,
      quantityInStock,
      minimumStock,
      unitOfMeasureId,
    } = createStockDto;

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

    if (!unitOfMeasureId) {
      throw new BadRequestException('You must provide a unitOfMeasureId.');
    }

    try {
      const unitOfMeasure = await this.unitOfMeasureRepository.findOne({
        where: { id: unitOfMeasureId },
      });
      if (!unitOfMeasure) {
        throw new NotFoundException(
          `Unit of mesure with ID: ${unitOfMeasureId} not found`,
        );
      }

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
      stock.unitOfMeasure = unitOfMeasure;

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
    const {
      productId,
      ingredientId,
      quantityInStock,
      minimumStock,
      unitOfMeasureId,
    } = updateStockDto;

    if (!id) {
      throw new BadRequestException('Either ID must be provided.');
    }
    if (!isUUID(id)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
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

      if (unitOfMeasureId) {
        const unitOfMeasure = await this.unitOfMeasureRepository.findOne({
          where: { id: unitOfMeasureId },
        });
        if (!unitOfMeasure) {
          throw new NotFoundException(
            `Unit of mesure with ID: ${unitOfMeasureId} not found`,
          );
        }
        stock.unitOfMeasure = unitOfMeasure;
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

  private async deductIngredientStock(
    ingredientId: string,
    quantity: number,
    unitOfMeasureId: string,
  ): Promise<void> {
    try {
      const ingredient = await this.ingredientRepository.findOne({
        where: { id: ingredientId },
        relations: ['stock', 'stock.unitOfMeasure', 'unitOfMeasure'],
      });

      if (!ingredient || !ingredient.stock) {
        throw new NotFoundException(
          `Ingredient with ID ${ingredientId} not found or has no stock.`,
        );
      }

      // Convertir la cantidad a la unidad de medida del stock
      const stockUnitId = ingredient.stock.unitOfMeasure.id;
      const quantityToDeduct = await this.unitOfMeasureService.convertUnit(
        unitOfMeasureId,
        stockUnitId,
        quantity,
      );

      if (ingredient.stock.quantityInStock < quantityToDeduct) {
        throw new BadRequestException(
          `Insufficient stock for ingredient ${ingredient.name}.`,
        );
      }

      ingredient.stock.quantityInStock -= quantityToDeduct;
      await this.stockRepository.save(ingredient.stock);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Error with ingredient stock discount',
        error.message,
      );
    }
  }

  private async deductProductStock(
    productId: string,
    quantity: number,
  ): Promise<void> {
    try {
      const product = await this.productRepository.findOne({
        where: { id: productId },
        relations: [
          'stock',
          'stock.unitOfMeasure',
          'productIngredients',
          'productIngredients.ingredient',
          'productIngredients.unitOfMeasure',
        ],
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found.`);
      }

      const unidad = await this.unitOfMeasureRepository.findOne({
        where: { name: 'Unidad' },
      });
      const unitOfMeasureId = unidad.id;

      if (product.type === 'product') {
        if (product.productIngredients.length === 0) {
          // Si el producto es simple, descontar directamente del stock
          if (!product.stock) {
            throw new NotFoundException(
              `Product with ID ${productId} has no stock.`,
            );
          }
          const stockUnitId = product.stock.unitOfMeasure.id;
          const quantityToDeduct = await this.unitOfMeasureService.convertUnit(
            unitOfMeasureId,
            stockUnitId,
            quantity,
          );

          if (product.stock.quantityInStock < quantityToDeduct) {
            throw new BadRequestException(
              `Insufficient stock for product ${product.name}.`,
            );
          }

          product.stock.quantityInStock -= quantityToDeduct;
          await this.stockRepository.save(product.stock);
        }
        // Si el producto está compuesto por ingredientes, descontar los ingredientes
        if (
          product.productIngredients &&
          product.productIngredients.length > 0
        ) {
          for (const productIngredient of product.productIngredients) {
            console.log(
              'producto compuesto, descontando ingrediente....',
              productIngredient.ingredient.id,
              productIngredient.quantityOfIngredient,
              productIngredient.unitOfMeasure.id,
            );
            await this.deductIngredientStock(
              productIngredient.ingredient.id,
              productIngredient.quantityOfIngredient * quantity,
              productIngredient.unitOfMeasure.id,
            );
          }
        }
      } else if (product.type === 'promotion') {
        // Si el producto es una promoción, descontar los productos que la componen
        const promotionProducts = await this.promotionProductRepository.find({
          where: { promotion: { id: productId } },
          relations: ['product'],
        });

        for (const promotionProduct of promotionProducts) {
          await this.deductProductStock(
            promotionProduct.product.id,
            promotionProduct.quantity * quantity,
          );
        }
      }
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Error with product stock discount',
        error.message,
      );
    }
  }

  async deductStock(productId: string, quantity: number): Promise<string> {
    console.log('pasando para descontar stock', productId, quantity);
    try {
      const product = await this.productRepository.findOne({
        where: { id: productId },
        relations: ['stock', 'stock.unitOfMeasure'],
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found.`);
      }
      await this.deductProductStock(productId, quantity);
      return 'Stock deducted successfully.';
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Error with product stock discount',
        error.message,
      );
    }
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
}
