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
import { UnitOfMeasure } from 'src/Ingredient/unitOfMesure.entity';
import { IngredientService } from 'src/Ingredient/ingredient.service';
import { PromotionProduct } from 'src/Product/promotionProducts.entity';

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
      const quantityToDeduct = await this.ingredientService.convertUnit(
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
    unitOfMeasureId: string,
  ): Promise<void> {
    try {
      const product = await this.productRepository.findOne({
        where: { id: productId },
        relations: [
          'stock',
          'stock.unitOfMeasure',
          'productIngredients',
          'productIngredients.ingredient',
        ],
      });

      if (!product || !product.stock) {
        throw new NotFoundException(
          `Product with ID ${productId} not found or has no stock.`,
        );
      }

      if (product.type === 'product') {
        // Si el producto es simple, descontar directamente del stock
        const stockUnitId = product.stock.unitOfMeasure.id;
        const quantityToDeduct = await this.ingredientService.convertUnit(
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
            unitOfMeasureId,
          );
        }
      }

      // Si el producto está compuesto por ingredientes, descontar los ingredientes
      if (product.productIngredients && product.productIngredients.length > 0) {
        for (const productIngredient of product.productIngredients) {
          await this.deductIngredientStock(
            productIngredient.ingredient.id,
            productIngredient.quantityOfIngredient * quantity,
            productIngredient.unitOfMeasure.id,
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

  async deductStock(
    productId: string,
    quantity: number,
    unitOfMeasureId: string,
  ): Promise<void> {
    try {
      const product = await this.productRepository.findOne({
        where: { id: productId },
        relations: ['stock', 'stock.unitOfMeasure'],
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found.`);
      }

      if (product.type === 'promotion') {
        // Si es una promoción, descontar los productos que la componen
        await this.deductProductStock(productId, quantity, unitOfMeasureId);
      } else if (product.type === 'product') {
        // Si es un producto, descontar directamente
        await this.deductProductStock(productId, quantity, unitOfMeasureId);
      } else {
        throw new BadRequestException('Invalid product type.');
      }
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Error with product stock discount',
        error.message,
      );
    }
  }
}
