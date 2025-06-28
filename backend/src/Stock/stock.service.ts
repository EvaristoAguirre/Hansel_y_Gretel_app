/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Stock } from './stock.entity';
import { CreateStockDto } from 'src/DTOs/create-stock.dto';
import { UpdateStockDto } from 'src/DTOs/update-stock.dto';
import { StockRepository } from './stock.repository';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { StockSummaryResponseDTO } from 'src/DTOs/stockSummaryResponse.dto';
import { UnitOfMeasureService } from 'src/UnitOfMeasure/unitOfMeasure.service';
import { IngredientService } from 'src/Ingredient/ingredient.service';
import { ProductService } from 'src/Product/product.service';
import { Product } from 'src/Product/product.entity';
import { Ingredient } from 'src/Ingredient/ingredient.entity';
import { isUUID } from 'class-validator';

@Injectable()
export class StockService {
  constructor(
    private readonly stockRepository: StockRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly unitOfMeasureService: UnitOfMeasureService,
    private readonly ingredientService: IngredientService,
    @Inject(forwardRef(() => ProductService))
    private readonly productService: ProductService,
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

    const unitOfMeasure =
      await this.unitOfMeasureService.getUnitOfMeasureById(unitOfMeasureId);
    if (!unitOfMeasure) {
      throw new NotFoundException(
        `Unit of mesure with ID: ${unitOfMeasureId} not found`,
      );
    }

    let product: Product | undefined;
    let ingredient: Ingredient | undefined;

    if (productId) {
      product =
        await this.productService.getProductByIdToAnotherService(productId);
      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }
    }

    if (ingredientId) {
      ingredient =
        await this.ingredientService.getIngredientByIdToAnotherService(
          ingredientId,
        );
      if (!ingredient) {
        throw new NotFoundException(
          `Ingredient with ID ${ingredientId} not found`,
        );
      }
    }

    const createdStock = await this.stockRepository.createAndSaveStock(
      quantityInStock,
      minimumStock,
      unitOfMeasure,
      product,
      ingredient,
    );

    this.eventEmitter.emit('stock.created', { stock: createdStock });

    return createdStock;
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

    if (!id || !isUUID(id)) {
      throw new BadRequestException('Invalid or missing stock ID.');
    }

    if (!productId && !ingredientId) {
      throw new BadRequestException(
        'You must provide either a productId or an ingredientId.',
      );
    }

    if (productId && ingredientId) {
      throw new BadRequestException(
        'You cannot assign a stock to both a product and an ingredient.',
      );
    }

    const stock = await this.stockRepository.findStockById(id);
    if (!stock) {
      throw new NotFoundException(`Stock with ID ${id} not found.`);
    }

    if (productId) {
      const product =
        await this.productService.getProductByIdToAnotherService(productId);

      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found.`);
      }
      stock.product = product;
      stock.ingredient = null;
    }

    if (ingredientId) {
      const ingredient =
        await this.ingredientService.getIngredientByIdToAnotherService(
          ingredientId,
        );
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
      const unitOfMeasure =
        await this.unitOfMeasureService.getUnitOfMeasureById(unitOfMeasureId);
      if (!unitOfMeasure) {
        throw new NotFoundException(
          `Unit of measure with ID: ${unitOfMeasureId} not found.`,
        );
      }
      stock.unitOfMeasure = unitOfMeasure;
    }

    const updatedStock = await this.stockRepository.saveStock(stock);

    this.eventEmitter.emit('stock.updated', { stock: updatedStock });

    return updatedStock;
  }

  async deductStock(
    productId: string,
    quantity: number,
    toppingsPerUnit?: string[][],
  ) {
    const product =
      await this.productService.getProductByIdToAnotherService(productId);
    if (!product) {
      throw new NotFoundException(`Product with ID ${productId} not found.`);
    }

    const unidad = await this.unitOfMeasureService.getUnitOfMeasureUnidad();
    const unidadId = unidad?.id;

    if (!unidadId) {
      throw new InternalServerErrorException('Unidad base no encontrada');
    }

    if (product.type === 'simple') {
      await this.deductSimpleStock(product, quantity, unidadId);
    } else if (product.type === 'product') {
      await this.deductCompositeStock(product, quantity);
    } else if (product.type === 'promotion') {
      await this.deductPromotionStock(product, quantity);
    }

    if (toppingsPerUnit?.length) {
      await this.deductToppingsStock(toppingsPerUnit, quantity);
    }

    this.eventEmitter.emit('stock.deducted', { stockDeducted: true });

    return 'Stock deducted successfully.';
  }

  private async deductSimpleStock(
    product: Product,
    quantity: number,
    unidadId: string,
  ) {
    if (!product.stock) {
      throw new NotFoundException(
        `Product ${product.name} has no associated stock.`,
      );
    }

    const stockUnitId = product.stock.unitOfMeasure.id;

    const quantityToDeduct = await this.unitOfMeasureService.convertUnit(
      unidadId,
      stockUnitId,
      quantity,
    );

    if (product.stock.quantityInStock < quantityToDeduct) {
      throw new BadRequestException(
        `Insufficient stock for product ${product.name}.`,
      );
    }

    product.stock.quantityInStock -= quantityToDeduct;
    await this.stockRepository.saveStock(product.stock);
  }

  private async deductCompositeStock(product: Product, quantity: number) {
    for (const pi of product.productIngredients) {
      await this.deductIngredientStock(
        pi.ingredient.id,
        pi.quantityOfIngredient * quantity,
        pi.unitOfMeasure.id,
      );
    }
  }

  private async deductPromotionStock(promotion: Product, quantity: number) {
    const promotionProducts =
      await this.productService.getPromotionProductsToAnotherService(
        promotion.id,
      );

    for (const promotionProduct of promotionProducts) {
      await this.deductStock(
        promotionProduct.product.id,
        promotionProduct.quantity * quantity,
      );
    }
  }

  private async deductIngredientStock(
    ingredientId: string,
    quantity: number,
    unitOfMeasureId: string,
  ) {
    const ingredient =
      await this.ingredientService.getIngredientByIdToAnotherService(
        ingredientId,
      );

    if (!ingredient || !ingredient.stock) {
      throw new NotFoundException(
        `Ingredient ${ingredientId} not found or has no stock.`,
      );
    }

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
    await this.stockRepository.saveStock(ingredient.stock);
  }

  private async deductToppingsStock(
    toppingsPerUnit: string[][],
    productQuantity: number,
  ) {
    const unidad = await this.unitOfMeasureService.getUnitOfMeasureUnidad();
    const unidadId = unidad?.id;
    if (!unidadId) {
      throw new InternalServerErrorException('Unidad base no encontrada');
    }

    // 1. Contar cuántas veces se usa cada topping en todas las unidades
    const toppingCountMap: Record<string, number> = {};

    for (const unitToppings of toppingsPerUnit) {
      for (const toppingId of unitToppings) {
        if (toppingCountMap[toppingId]) {
          toppingCountMap[toppingId] += 1;
        } else {
          toppingCountMap[toppingId] = 1;
        }
      }
    }

    // 2. Recorrer cada topping único
    for (const [toppingId, countPerUnit] of Object.entries(toppingCountMap)) {
      const toppingStock =
        await this.stockRepository.getStockByToppingId(toppingId);
      if (!toppingStock) {
        throw new NotFoundException(`No stock found for topping ${toppingId}`);
      }

      const totalCount = countPerUnit * productQuantity;

      const quantityToDeduct = await this.unitOfMeasureService.convertUnit(
        unidadId,
        toppingStock.unitOfMeasure.id,
        totalCount,
      );

      if (Number(toppingStock.quantityInStock) < quantityToDeduct) {
        throw new BadRequestException(
          `Insufficient stock for topping ${toppingId}`,
        );
      }

      toppingStock.quantityInStock -= quantityToDeduct;
      await this.stockRepository.saveStock(toppingStock);
    }
  }

  //   async restoreStockFromOrder(order: Order) {
  //   for (const detail of order.orderDetails) {
  //     const { product, quantity, toppingDetails } = detail;

  //     // 1. Restituir stock del producto o sus ingredientes
  //     await this.restockProduct(product, quantity);

  //     // 2. Restituir stock de toppings
  //     for (const td of toppingDetails) {
  //       await this.restockTopping(td.topping, td.quantity, td.unitOfMeasure.id);
  //     }
  //   }

  //   this.eventEmitter.emit('stock.restituted', { orderId: order.id });
  // }
}
