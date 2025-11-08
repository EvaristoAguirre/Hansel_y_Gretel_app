/* eslint-disable prettier/prettier */
import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { CreateProductDto } from '../DTOs/create-product.dto';
import { UpdateProductDto } from 'src/DTOs/update-product-dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ProductResponseDto } from 'src/DTOs/productResponse.dto';
import { CheckStockDto } from 'src/DTOs/checkStock.dto';
import { Product } from './product.entity';
import { ProductRepository } from 'src/Product/product.repository';
import { ProductMapper } from './productMapper';
import { isUUID } from 'class-validator';
import { StockService } from 'src/Stock/stock.service';
import { UnitOfMeasureService } from 'src/UnitOfMeasure/unitOfMeasure.service';
import { CostCascadeService } from 'src/CostCascade/cost-cascade.service';
import { IngredientService } from 'src/Ingredient/ingredient.service';
import { parseLocalizedNumber } from 'src/Helpers/parseLocalizedNumber';
import { LoggerService } from 'src/Monitoring/monitoring-logger.service';

@Injectable()
export class ProductService {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly eventEmitter: EventEmitter2,
    private readonly stockService: StockService,
    private readonly unitOfMeasureService: UnitOfMeasureService,
    private readonly costCascadeService: CostCascadeService,
    private readonly ingredientService: IngredientService,
    private readonly monitoringLogger: LoggerService,
  ) {}

  // ------- rta en string sin decimales y punto de mil
  async getAllProducts(
    page: number,
    limit: number,
  ): Promise<ProductResponseDto[]> {
    try {
      const products = await this.productRepository.getAllProducts(page, limit);
      return ProductMapper.toResponseDtoArray(products);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;

      throw new InternalServerErrorException(
        'Error fetching the products',
        error.message,
      );
    }
  }

  // ------- rta en string sin decimales y punto de mil
  async getProductById(id: string): Promise<ProductResponseDto> {
    if (!id) {
      throw new BadRequestException('Either ID must be provided.');
    }
    if (!isUUID(id)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
    }
    try {
      const product = await this.productRepository.getProductById(id);
      return ProductMapper.toResponseDto(product);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error fetching the product',
        error.message,
      );
    }
  }

  // ---------- CUIDADO QUE ESTE ES PARA OTRO SERVICIO
  async getProductByIdToAnotherService(id: string): Promise<Product> {
    if (!id) {
      throw new BadRequestException('Either ID must be provided.');
    }
    if (!isUUID(id)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
    }
    try {
      const product =
        await this.productRepository.getProductByIdToAnotherService(id);
      return product;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error fetching the product',
        error.message,
      );
    }
  }

  // ------- rta en string sin decimales y punto de mil
  async getProductByCode(code: number): Promise<ProductResponseDto> {
    return await this.productRepository.getProductByCode(code);
  }

  // ------- rta en string sin decimales y punto de mil
  async getProductByName(name: string): Promise<ProductResponseDto> {
    return this.productRepository.getProductByName(name);
  }

  // ------- rta en string sin decimales y punto de mil
  async getProductsByCategories(
    categories: string[],
  ): Promise<ProductResponseDto[]> {
    const products =
      await this.productRepository.getProductsByCategories(categories);
    if (products.length === 0) {
      throw new NotFoundException(
        `No products found for the given categories: ${categories.join(', ')}`,
      );
    }
    return products;
  }

  // ------- rta en string sin decimales y punto de mil
  async createProduct(
    productToCreate: CreateProductDto,
  ): Promise<ProductResponseDto> {
    const productCreated =
      await this.productRepository.createProduct(productToCreate);

    this.eventEmitter.emit('product.created', {
      product: productCreated,
    });
    return productCreated;
  }

  // ------- rta en string sin decimales y punto de mil
  async updateProduct(
    id: string,
    updateData: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const currentProduct = await this.productRepository.getProductById(id);
    const productUpdated = await this.productRepository.updateProduct(
      id,
      updateData,
    );

    if (
      currentProduct.type === 'simple' &&
      typeof updateData.baseCost === 'number' &&
      updateData.baseCost !== currentProduct.baseCost
    ) {
      const cascadeResult =
        await this.costCascadeService.updateSimpleProductCostAndCascade(
          productUpdated.id,
          updateData.baseCost,
        );
      if (cascadeResult.success) {
        console.log(`📦 Producto ${id} actualizado. Promociones afectadas:`);
        for (const promoId of cascadeResult.updatedPromotions) {
          console.log(`🎁 -> Promoción recalculada: ${promoId}`);
        }
      } else {
        console.error(
          `⚠️ Falló la cascada de costos para producto ${id}: ${cascadeResult.message}`,
        );
      }
    }

    if (
      currentProduct.type === 'product' &&
      Number(productUpdated.cost) !== Number(currentProduct.cost)
    ) {
      const cascadeResult =
        await this.costCascadeService.updateSimpleProductCostAndCascade(
          productUpdated.id,
          updateData.baseCost,
        );
      if (cascadeResult.success) {
        console.log(
          `📦 Producto: ${productUpdated.name} ${id} actualizado. Promociones afectadas:`,
        );
        for (const promoId of cascadeResult.updatedPromotions) {
          console.log(`🎁 -> Promoción recalculada: ${promoId}`);
        }
      } else {
        console.error(
          `⚠️ Falló la cascada de costos para producto ${productUpdated.name}: ${cascadeResult.message}`,
        );
      }
    }

    this.eventEmitter.emit('product.updated', {
      product: productUpdated,
    });

    return productUpdated;
  }

  async deleteProduct(id: string) {
    if (!id) {
      throw new BadRequestException('Product id must be provided.');
    }
    if (!isUUID(id)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
    }
    try {
      const productDeleted = await this.productRepository.deleteProduct(id);

      this.eventEmitter.emit('product.deleted', {
        product: productDeleted,
      });

      return productDeleted;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error fetching the product',
        error.message,
      );
    }
  }

  // ------- rta en string sin decimales y punto de mil
  async searchProducts(
    name?: string,
    code?: string,
    categories?: string[],
    isActive?: boolean,
    page?: number,
    limit?: number,
  ): Promise<ProductResponseDto[]> {
    return this.productRepository.searchProducts(
      name,
      code,
      categories,
      isActive,
      page,
      limit,
    );
  }

  // ------- rta en string sin decimales y punto de mil
  async searchProductsToPromotion(
    isActive: boolean,
    page: number,
    limit: number,
    name?: string,
    code?: number,
  ): Promise<ProductResponseDto[]> {
    return this.productRepository.searchProductsToPromotion(
      isActive,
      page,
      limit,
      name,
      code,
    );
  }

  // ------- rta en string sin decimales y punto de mil
  async getSimpleAndCompositeProducts(
    page: number,
    limit: number,
  ): Promise<ProductResponseDto[]> {
    const products = await this.productRepository.getSimpleAndCompositeProducts(
      page,
      limit,
    );
    return ProductMapper.toResponseDtoArray(products);
  }

  async checkProductsStockAvailability(
    dataToCheck: CheckStockDto,
  ): Promise<any> {
    const { productId, quantityToSell, toppingsPerUnit } = dataToCheck;

    if (!isUUID(productId)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
    }
    const product = await this.productRepository.getProductById(productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.type === 'promotion') {
      const promotion = await this.productRepository.getProductWithRelations(
        productId,
        'promotion',
      );
      const result = await this.checkPromotionStock(promotion, quantityToSell);
      return result;
    } else {
      const product = await this.productRepository.getProductWithRelations(
        productId,
        'product',
      );
      const productStockCheck = await this.checkProductStock(
        product,
        quantityToSell,
      );
      if (!productStockCheck.available) {
        return productStockCheck;
      }

      if (toppingsPerUnit?.length) {
        const toppingCheck = await this.checkToppingsStock(
          toppingsPerUnit,
          quantityToSell,
          product,
        );

        if (!toppingCheck.available) {
          return {
            available: false,
            message: toppingCheck.message,
            details: toppingCheck.toppingDetails,
          };
        }
      }

      return { available: true };
    }
  }

  private async checkProductStock(
    product: Product,
    quantityToSell: number,
  ): Promise<any> {
    if (!product.productIngredients?.length) {
      // Producto simple sin ingredientes
      if (!product.stock) {
        return {
          available: false,
          message: 'El producto no tiene información de stock',
        };
      }

      const available = parseLocalizedNumber(product.stock.quantityInStock);

      return available >= quantityToSell
        ? { available: true }
        : {
            available: false,
            message: `Stock insuficiente. Disponible: ${available}, Requerido: ${quantityToSell}`,
            details: {
              available,
              required: quantityToSell,
              deficit: quantityToSell - available,
            },
          };
    }

    // Producto compuesto
    const checks = await Promise.all(
      product.productIngredients.map(async (pi) => {
        const ingredientStock = await this.stockService.getStockByIngredientId(
          pi.ingredient.id,
        );

        if (!ingredientStock.quantityInStock) {
          return {
            available: false,
            ingredientId: pi.ingredient.id,
            ingredientName: pi.ingredient.name,
            message: 'El ingrediente no tiene información de stock',
          };
        }

        let requiredQuantity = parseLocalizedNumber(pi.quantityOfIngredient);

        if (pi.unitOfMeasure?.id !== ingredientStock.unitOfMeasure?.id) {
          requiredQuantity = await this.unitOfMeasureService.convertUnit(
            pi.unitOfMeasure.id,
            ingredientStock.unitOfMeasure.id,
            requiredQuantity,
          );
        }

        const totalRequired = requiredQuantity * quantityToSell;
        const available = parseLocalizedNumber(ingredientStock.quantityInStock);

        return {
          available: available >= totalRequired,
          ingredientId: pi.ingredient.id,
          ingredientName: pi.ingredient.name,
          requiredQuantity: totalRequired,
          availableQuantity: available,
          deficit: available >= totalRequired ? 0 : totalRequired - available,
          unitOfMeasure: ingredientStock.unitOfMeasure.name,
        };
      }),
    );

    const allAvailable = checks.every((r) => r.available);

    return allAvailable
      ? { available: true }
      : {
          available: false,
          message: 'Stock insuficiente para algunos ingredientes',
          details: checks.filter((r) => !r.available),
        };
  }

  private async checkPromotionStock(
    promotion: Product,
    quantityToSell: number,
  ) {
    try {
      if (!promotion) {
        throw new NotFoundException('Promotion not found');
      }

      if (
        !promotion.promotionDetails ||
        promotion.promotionDetails.length === 0
      ) {
        return {
          available: false,
          message: 'Promotion has no associated products',
        };
      }

      const productChecks = await Promise.all(
        promotion.promotionDetails.map(async (pp) => {
          const product = pp.product;

          const requiredQuantity = pp.quantity * quantityToSell;
          if (
            !product.productIngredients ||
            product.productIngredients.length === 0
          ) {
            if (!product.stock) {
              return {
                productId: product.id,
                productName: product.name,
                available: false,
                message: 'El producto no cuenta con información de stock',
              };
            }
            const availableQuantity = product.stock.quantityInStock;

            if (availableQuantity >= requiredQuantity) {
              return {
                productId: product.id,
                productName: product.name,
                available: true,
              };
            } else {
              return {
                productId: product.id,
                productName: product.name,
                available: false,
                message: `Stock insuficiente. Disponible: ${availableQuantity}, Requerido: ${requiredQuantity}`,
                details: {
                  available: availableQuantity,
                  required: requiredQuantity,
                  deficit: requiredQuantity - availableQuantity,
                },
              };
            }
          }

          const ingredientChecks = await Promise.all(
            product.productIngredients.map(async (pi) => {
              const ingredientId = pi.ingredient.id;
              const stockOfIngredient =
                await this.stockService.getStockByIngredientId(ingredientId);

              if (!stockOfIngredient.quantityInStock) {
                return {
                  ingredientId: ingredientId,
                  ingredientName: stockOfIngredient.ingredient.name,
                  available: false,
                  message: 'El ingrediente no tiene información de stock',
                };
              }

              let requiredIngredientQuantity =
                pi.quantityOfIngredient * requiredQuantity;

              if (
                pi.unitOfMeasure?.id !== stockOfIngredient.unitOfMeasure?.id
              ) {
                try {
                  requiredIngredientQuantity =
                    await this.unitOfMeasureService.convertUnit(
                      pi.unitOfMeasure.id,
                      stockOfIngredient.unitOfMeasure.id,
                      pi.quantityOfIngredient * requiredQuantity,
                    );
                } catch (error) {
                  return {
                    ingredientId: stockOfIngredient.ingredient.id,
                    ingredientName: stockOfIngredient.ingredient.name,
                    available: false,
                    message: `Unit conversion error: ${error.message}`,
                  };
                }
              }

              const availableQuantity = parseLocalizedNumber(
                stockOfIngredient.quantityInStock,
              );

              return {
                ingredientId: stockOfIngredient.ingredient.id,
                ingredientName: stockOfIngredient.ingredient.name,
                requiredQuantity: requiredIngredientQuantity,
                availableQuantity: availableQuantity,
                available: availableQuantity >= requiredIngredientQuantity,
                unitOfMeasure: stockOfIngredient.unitOfMeasure.name,
                deficit:
                  availableQuantity >= requiredIngredientQuantity
                    ? 0
                    : requiredIngredientQuantity - availableQuantity,
              };
            }),
          );

          const allIngredientsAvailable = ingredientChecks.every(
            (check) => check.available,
          );

          return {
            productId: product.id,
            productName: product.name,
            available: allIngredientsAvailable,
            details: allIngredientsAvailable
              ? null
              : {
                  message: 'Stock insuficiente para algunos ingredientes',
                  ingredientDetails: ingredientChecks.filter(
                    (check) => !check.available,
                  ),
                },
          };
        }),
      );

      const allProductsAvailable = productChecks.every(
        (check) => check.available,
      );

      if (allProductsAvailable) {
        return { available: true };
      } else {
        const unavailableProducts = productChecks.filter(
          (check) => !check.available,
        );
        return {
          available: false,
          message:
            'Stock insuficiente para algunos productos de esta promoción',
          details: unavailableProducts.map((up) => ({
            productId: up.productId,
            productName: up.productName,
            reason: up.message || 'Ingrediente insuficiente',
            details: up.details,
          })),
        };
      }
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error checking promotion stock availability',
        error.message,
      );
    }
  }

  private async checkToppingsStock(
    toppingsPerUnit: string[],
    quantityToSell: number,
    product: Product,
  ): Promise<any> {
    if (!product.availableToppingGroups?.length) {
      console.warn(
        '[TOPPING CHECK] El producto no admite toppings, pero se enviaron toppings.',
      );
      return {
        available: false,
        message: 'El producto no admite toppings, pero se enviaron toppings.',
      };
    }

    const toppingChecks = await Promise.all(
      toppingsPerUnit.map(async (toppingId) => {
        try {
          const topping =
            await this.ingredientService.getIngredientByIdToAnotherService(
              toppingId,
            );

          if (!topping) {
            console.warn(`[TOPPING CHECK] Topping no encontrado: ${toppingId}`);
            return {
              toppingId,
              available: false,
              message: 'Topping no encontrado',
            };
          }

          const toppingGroup = product.availableToppingGroups.find((group) =>
            group.toppingGroup.toppings.some((t) => t.id === toppingId),
          );

          if (!toppingGroup) {
            console.warn(
              `[TOPPING CHECK] Topping ${topping.name} no está habilitado para este producto.`,
            );
            return {
              toppingId,
              toppingName: topping.name,
              available: false,
              message: 'Topping no habilitado para este producto',
            };
          }

          let requiredQty = parseLocalizedNumber(
            toppingGroup.quantityOfTopping,
          );

          const stock =
            await this.stockService.getStockByIngredientId(toppingId);

          if (
            !stock ||
            stock.quantityInStock == null ||
            stock.unitOfMeasure == undefined
          ) {
            console.warn(
              `[TOPPING CHECK] No hay stock disponible o falta unidad para ${topping.name}`,
            );
            return {
              toppingId,
              toppingName: topping.name,
              available: false,
              message: 'No hay información de stock para el topping',
            };
          }

          console.log(
            `[TOPPING CHECK] Stock actual de ${topping.name}: ${stock.quantityInStock} ${stock.unitOfMeasure?.name} (${stock.unitOfMeasure?.id})`,
          );

          // Conversión de unidades si es necesario
          if (toppingGroup.unitOfMeasure?.id !== stock.unitOfMeasure?.id) {
            console.log(
              `[TOPPING CHECK] Necesita conversión de unidades: ${requiredQty} ${toppingGroup.unitOfMeasure.name} → ${stock.unitOfMeasure.name}`,
            );

            requiredQty = await this.unitOfMeasureService.convertUnit(
              toppingGroup.unitOfMeasure.id,
              stock.unitOfMeasure.id,
              requiredQty,
            );
          }

          const totalRequired = requiredQty * quantityToSell;
          const availableQty = parseLocalizedNumber(stock.quantityInStock);

          return {
            toppingId,
            toppingName: topping.name,
            requiredQuantity: totalRequired,
            availableQuantity: availableQty,
            unitOfMeasure: stock.unitOfMeasure.name,
            available: availableQty >= totalRequired,
            deficit:
              availableQty >= totalRequired ? 0 : totalRequired - availableQty,
          };
        } catch (error) {
          console.error(
            `[TOPPING CHECK] Error al procesar topping ${toppingId}:`,
            error?.message || error,
          );
          return {
            toppingId,
            available: false,
            message:
              error?.message ?? 'Error inesperado al verificar el topping',
          };
        }
      }),
    );

    const allAvailable = toppingChecks.every((check) => check.available);

    if (!allAvailable) {
      console.warn(
        '[TOPPING CHECK] Detalles de toppings con stock insuficiente:',
        toppingChecks.filter((check) => !check.available),
      );
    }

    return allAvailable
      ? { available: true }
      : {
          available: false,
          message: 'Stock insuficiente para uno o más toppings',
          toppingDetails: toppingChecks.filter((check) => !check.available),
        };
  }

  async getProductsWithStock(): Promise<Product[]> {
    return this.productRepository.getProductsWithStock();
  }

  async getPromotionProductsToAnotherService(promotionId: string) {
    if (!promotionId) {
      throw new BadRequestException('Either ID must be provided.');
    }
    if (!isUUID(promotionId)) {
      throw new BadRequestException(
        'Invalid ID format. ID must be a valid UUID.',
      );
    }
    try {
      return await this.productRepository.getPromotionProductsToAnotherService(
        promotionId,
      );
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      throw new InternalServerErrorException(
        'Error fetching the product',
        error.message,
      );
    }
  }
}
